import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import * as path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const builtServer = fileURLToPath(new URL('../dist/server.mjs', import.meta.url))

class LspClient {
  constructor(server, cwd) {
    this.child = spawn(process.execPath, [server, '--stdio'], {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    this.buffer = Buffer.alloc(0)
    this.messages = []
    this.waiters = []
    this.nextId = 1
    this.stderr = ''
    this.child.stdout.on('data', chunk => this.consume(chunk))
    this.child.stderr.on('data', chunk => {
      this.stderr += chunk.toString()
    })
  }

  consume(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (true) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n')
      if (headerEnd < 0) {
        return
      }
      const header = this.buffer.subarray(0, headerEnd).toString()
      const match = /Content-Length:\s*(\d+)/i.exec(header)
      assert.ok(match, `Invalid LSP header: ${header}`)
      const length = Number(match[1])
      const bodyStart = headerEnd + 4
      if (this.buffer.length < bodyStart + length) {
        return
      }
      const message = JSON.parse(this.buffer.subarray(bodyStart, bodyStart + length).toString())
      this.buffer = this.buffer.subarray(bodyStart + length)
      this.dispatch(message)
    }
  }

  dispatch(message) {
    const waiterIndex = this.waiters.findIndex(waiter => waiter.predicate(message))
    if (waiterIndex >= 0) {
      const [waiter] = this.waiters.splice(waiterIndex, 1)
      clearTimeout(waiter.timer)
      waiter.resolve(message)
    } else {
      this.messages.push(message)
    }
  }

  send(message) {
    const body = Buffer.from(JSON.stringify(message))
    this.child.stdin.write(`Content-Length: ${body.length}\r\n\r\n`)
    this.child.stdin.write(body)
  }

  request(method, params) {
    const id = this.nextId++
    this.send({ jsonrpc: '2.0', id, method, params })
    return this.waitFor(message => message.id === id)
  }

  waitFor(predicate, timeout = 10_000) {
    const existing = this.messages.findIndex(predicate)
    if (existing >= 0) {
      const [message] = this.messages.splice(existing, 1)
      return Promise.resolve(message)
    }
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        timer: setTimeout(() => {
          const index = this.waiters.indexOf(waiter)
          if (index >= 0) {
            this.waiters.splice(index, 1)
          }
          reject(new Error(`Timed out waiting for LSP message. stderr: ${this.stderr}`))
        }, timeout)
      }
      this.waiters.push(waiter)
    })
  }

  async shutdown() {
    const response = await this.request('shutdown', null)
    assert.equal(response.result, null)
    this.send({ jsonrpc: '2.0', method: 'exit', params: null })
    const code = await new Promise(resolve => this.child.once('exit', resolve))
    assert.equal(code, 0, this.stderr)
  }

  kill() {
    this.child.kill()
  }
}

async function addInterface(root, relative) {
  const dir = path.join(root, relative)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'interface.json'), '{}')
}

function positionAtOffset(content, offset) {
  const before = content.slice(0, offset).split('\n')
  return { line: before.length - 1, character: before.at(-1).length }
}

test('standalone server discovers recursive projects in every workspace', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)

    const first = path.join(temp, 'workspace-a')
    const second = path.join(temp, 'workspace-b')
    await addInterface(first, path.join('apps', 'alpha'))
    await addInterface(first, path.join('.hidden', 'ignored'))
    await addInterface(first, path.join('node_modules', 'ignored'))
    await addInterface(first, path.join('MaaUtils', 'ignored'))
    await addInterface(first, path.join('MaaDeps', 'ignored'))
    await addInterface(second, path.join('deep', 'beta'))

    client = new LspClient(server, temp)
    const initialized = await client.request('initialize', {
      processId: process.pid,
      rootUri: null,
      capabilities: { workspace: { workspaceFolders: true } },
      workspaceFolders: [first, second].map(folder => ({
        name: path.basename(folder),
        uri: pathToFileURL(folder).href
      }))
    })
    assert.equal(initialized.result.capabilities.textDocumentSync, 2)
    assert.deepEqual(initialized.result.capabilities.completionProvider.triggerCharacters, [
      '"',
      '[',
      ']',
      '$'
    ])
    assert.equal(initialized.result.capabilities.definitionProvider, true)
    assert.equal(initialized.result.capabilities.hoverProvider, true)
    assert.equal(initialized.result.capabilities.inlayHintProvider, true)
    assert.equal(initialized.result.capabilities.referencesProvider, true)
    assert.equal(initialized.result.capabilities.workspaceSymbolProvider, true)
    assert.deepEqual(initialized.result.capabilities.codeLensProvider, { resolveProvider: false })

    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    const loaded = await client.waitFor(
      message =>
        message.method === 'window/logMessage' &&
        message.params.message === 'maa-lsp: loaded 2 interface projects'
    )
    assert.equal(loaded.params.type, 3)
    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true })
  }
})

test('hover reads an unsaved pipeline document from the LSP buffer', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-buffer-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)
    const workspace = path.join(temp, 'workspace')
    const pipelineDir = path.join(workspace, 'resource', 'pipeline')
    const pipelineFile = path.join(pipelineDir, 'tasks.json')
    await mkdir(pipelineDir, { recursive: true })
    await writeFile(
      path.join(workspace, 'interface.json'),
      JSON.stringify({ resource: [{ name: 'Default', path: 'resource' }] })
    )
    await writeFile(pipelineFile, JSON.stringify({ DiskTask: {} }, null, 2))

    client = new LspClient(server, temp)
    await client.request('initialize', {
      processId: process.pid,
      rootUri: pathToFileURL(workspace).href,
      capabilities: {},
      workspaceFolders: null
    })
    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    await client.waitFor(
      message =>
        message.method === 'window/logMessage' &&
        message.params.message === 'maa-lsp: loaded 1 interface project'
    )

    const unsaved = '{\n  "UnsavedTask": {\n    "next": []\n  }\n}'
    const uri = pathToFileURL(pipelineFile).href
    client.send({
      jsonrpc: '2.0',
      method: 'textDocument/didOpen',
      params: {
        textDocument: { uri, languageId: 'json', version: 1, text: unsaved }
      }
    })
    const hover = await client.request('textDocument/hover', {
      textDocument: { uri },
      position: { line: 1, character: 5 }
    })
    assert.match(hover.result.contents.value, /UnsavedTask/)
    assert.doesNotMatch(hover.result.contents.value, /DiskTask/)

    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true })
  }
})

test('loads and watches maatools.config.mts in each workspace', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-config-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)
    const workspace = path.join(temp, 'workspace')
    await addInterface(workspace, '.')
    const configFile = path.join(workspace, 'maatools.config.mts')
    await writeFile(configFile, 'export default { marker: "first" }')
    const loadedMessage = `maa-lsp: loaded maatools.config.mts from ${workspace}`

    client = new LspClient(server, temp)
    await client.request('initialize', {
      processId: process.pid,
      rootUri: pathToFileURL(workspace).href,
      capabilities: {},
      workspaceFolders: null
    })
    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    try {
      await client.waitFor(
        message =>
          message.method === 'window/logMessage' &&
          message.params.message.toLowerCase() === loadedMessage.toLowerCase()
      )
    } catch (error) {
      throw new Error(`${String(error)}\nPending messages: ${JSON.stringify(client.messages)}`)
    }

    await writeFile(configFile, 'export default { marker: "second" }')
    try {
      await client.waitFor(
        message =>
          message.method === 'window/logMessage' &&
          message.params.message === 'maa-lsp: reloading changed maatools.config.mts'
      )
      await client.waitFor(
        message =>
          message.method === 'window/logMessage' &&
          message.params.message.toLowerCase() === loadedMessage.toLowerCase()
      )
    } catch (error) {
      throw new Error(`${String(error)}\nPending messages: ${JSON.stringify(client.messages)}`)
    }

    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})

test('applies custom recognition and action parsers from maatools.config.mts', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-parser-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)
    const workspace = path.join(temp, 'workspace')
    const pipelineDir = path.join(workspace, 'resource', 'pipeline')
    const pipelineFile = path.join(pipelineDir, 'tasks.json')
    await mkdir(pipelineDir, { recursive: true })
    await writeFile(
      path.join(workspace, 'interface.json'),
      JSON.stringify({ resource: [{ name: 'Default', path: 'resource' }] })
    )
    await writeFile(
      path.join(workspace, 'maatools.config.mts'),
      `export default {
        parser: {
          customReco(name, param, utils) {
            if (name !== 'LinkReco') return []
            return utils.parseObject(param)
              .filter(([key, node]) => key === 'node' && utils.isString(node))
              .map(([, node]) => ({ node, type: 'taskRef', missingPolicy: 'error' }))
          },
          customAction(name, param, utils) {
            if (name !== 'LinkAction') return []
            return utils.parseObject(param)
              .filter(([key, node]) => key === 'node' && utils.isString(node))
              .map(([, node]) => ({ node, type: 'taskRef', missingPolicy: 'error' }))
          }
        }
      }`
    )
    await writeFile(
      pipelineFile,
      JSON.stringify(
        {
          Entry: {
            recognition: {
              type: 'Custom',
              param: {
                custom_recognition: 'LinkReco',
                custom_recognition_param: { node: 'MissingReco' }
              }
            },
            action: {
              type: 'Custom',
              param: {
                custom_action: 'LinkAction',
                custom_action_param: { node: 'MissingAction' }
              }
            }
          }
        },
        null,
        2
      )
    )

    client = new LspClient(server, temp)
    await client.request('initialize', {
      processId: process.pid,
      rootUri: pathToFileURL(workspace).href,
      capabilities: {},
      workspaceFolders: null
    })
    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    let diagnostics
    try {
      diagnostics = await client.waitFor(
        message =>
          message.method === 'textDocument/publishDiagnostics' &&
          message.params.diagnostics.length >= 2
      )
    } catch (error) {
      throw new Error(`${String(error)}\nPending messages: ${JSON.stringify(client.messages)}`)
    }
    assert.deepEqual(diagnostics.params.diagnostics.map(diagnostic => diagnostic.message).sort(), [
      '未知任务 MissingAction',
      '未知任务 MissingReco'
    ])

    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})

test('applies diagnostic severity and ignore overrides from maatools.config.mts', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-check-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)
    const workspace = path.join(temp, 'workspace')
    const pipelineDir = path.join(workspace, 'resource', 'pipeline')
    await mkdir(pipelineDir, { recursive: true })
    await writeFile(
      path.join(workspace, 'interface.json'),
      JSON.stringify({ resource: [{ name: 'Default', path: 'resource' }] })
    )
    await writeFile(
      path.join(workspace, 'maatools.config.mts'),
      `export default {
        check: {
          override: {
            'unknown-task': 'warning',
            'dynamic-image': 'ignore'
          }
        }
      }`
    )
    await writeFile(
      path.join(pipelineDir, 'tasks.json'),
      JSON.stringify(
        {
          Entry: {
            recognition: {
              type: 'TemplateMatch',
              param: { template: 'dynamic/template' }
            },
            next: ['MissingTask']
          }
        },
        null,
        2
      )
    )

    client = new LspClient(server, temp)
    await client.request('initialize', {
      processId: process.pid,
      rootUri: pathToFileURL(workspace).href,
      capabilities: {},
      workspaceFolders: null
    })
    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    const published = await client.waitFor(
      message =>
        message.method === 'textDocument/publishDiagnostics' &&
        message.params.diagnostics.some(diagnostic => diagnostic.message.includes('MissingTask'))
    )
    assert.deepEqual(published.params.diagnostics, [
      {
        severity: 2,
        range: published.params.diagnostics[0].range,
        message: '未知任务 MissingTask',
        source: 'maa'
      }
    ])
    await assert.rejects(
      client.waitFor(
        message =>
          message.method === 'textDocument/publishDiagnostics' &&
          message.params.diagnostics.some(diagnostic => diagnostic.message.includes('MissingTask')),
        800
      ),
      /Timed out waiting for LSP message/
    )

    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})

test('hot reloads resource selection from config/maa_pi_config.json', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-selection-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)
    const workspace = path.join(temp, 'workspace')
    const configDir = path.join(workspace, 'config')
    const configFile = path.join(configDir, 'maa_pi_config.json')
    const firstPipeline = path.join(workspace, 'first', 'pipeline')
    const secondPipeline = path.join(workspace, 'second', 'pipeline')
    await mkdir(configDir, { recursive: true })
    await mkdir(firstPipeline, { recursive: true })
    await mkdir(secondPipeline, { recursive: true })
    await writeFile(
      path.join(workspace, 'interface.json'),
      JSON.stringify({
        resource: [
          { name: 'First', path: 'first' },
          { name: 'Second', path: 'second' }
        ]
      })
    )
    await writeFile(configFile, JSON.stringify({ resource: 'First' }))
    await writeFile(path.join(firstPipeline, 'tasks.json'), JSON.stringify({ FirstTask: {} }))
    await writeFile(
      path.join(secondPipeline, 'tasks.json'),
      JSON.stringify({ SecondTask: { next: ['OnlyInSecond'] } }, null, 2)
    )

    client = new LspClient(server, temp)
    await client.request('initialize', {
      processId: process.pid,
      rootUri: pathToFileURL(workspace).href,
      capabilities: {},
      workspaceFolders: null
    })
    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    await client.waitFor(
      message =>
        message.method === 'window/logMessage' &&
        message.params.message === 'maa-lsp: loaded 1 interface project'
    )

    await writeFile(configFile, JSON.stringify({ resource: 'Second' }))
    await client.waitFor(
      message =>
        message.method === 'window/logMessage' &&
        message.params.message.toLowerCase() ===
          `maa-lsp: reloaded maa_pi_config.json for ${workspace}`.toLowerCase()
    )
    const published = await client.waitFor(
      message =>
        message.method === 'textDocument/publishDiagnostics' &&
        message.params.diagnostics.some(diagnostic => diagnostic.message.includes('OnlyInSecond'))
    )
    assert.deepEqual(
      published.params.diagnostics.map(diagnostic => diagnostic.message),
      ['未知任务 OnlyInSecond']
    )

    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})

test('reports maatools.config.mts load failures without stopping the project', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-config-error-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)
    const workspace = path.join(temp, 'workspace')
    await addInterface(workspace, '.')
    await writeFile(path.join(workspace, 'maatools.config.mts'), 'export default { broken:')

    client = new LspClient(server, temp)
    await client.request('initialize', {
      processId: process.pid,
      rootUri: pathToFileURL(workspace).href,
      capabilities: {},
      workspaceFolders: null
    })
    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    let shown
    try {
      shown = await client.waitFor(
        message =>
          message.method === 'window/showMessage' &&
          message.params.type === 1 &&
          message.params.message.includes('failed to load')
      )
    } catch (error) {
      throw new Error(`${String(error)}\nPending messages: ${JSON.stringify(client.messages)}`)
    }
    assert.match(shown.params.message, /maatools\.config\.mts/)
    assert.match(shown.params.message, /workspace/)
    await client.waitFor(
      message =>
        message.method === 'window/logMessage' &&
        message.params.message === 'maa-lsp: loaded 1 interface project'
    )

    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})

test('completes pipeline tasks and interface references', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-completion-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)
    const workspace = path.join(temp, 'workspace')
    const pipelineDir = path.join(workspace, 'resource', 'pipeline')
    const pipelineFile = path.join(pipelineDir, 'tasks.json')
    const interfaceFile = path.join(workspace, 'interface.json')
    await mkdir(pipelineDir, { recursive: true })
    const interfaceText = JSON.stringify(
      {
        controller: [{ name: 'Adb' }, { name: 'Win32' }],
        resource: [
          {
            name: 'Default',
            path: 'resource',
            controller: ['Adb']
          }
        ]
      },
      null,
      2
    )
    const pipelineText = JSON.stringify(
      {
        ExistingTask: {},
        Entry: { next: ['ExistingTask'] },
        Other: { next: ['ExistingTask'] }
      },
      null,
      2
    )
    await writeFile(interfaceFile, interfaceText)
    await writeFile(pipelineFile, pipelineText)

    client = new LspClient(server, temp)
    await client.request('initialize', {
      processId: process.pid,
      rootUri: pathToFileURL(workspace).href,
      capabilities: {},
      workspaceFolders: null
    })
    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    await client.waitFor(
      message =>
        message.method === 'window/logMessage' &&
        message.params.message === 'maa-lsp: loaded 1 interface project'
    )

    const pipelineCompletion = await client.request('textDocument/completion', {
      textDocument: { uri: pathToFileURL(pipelineFile).href },
      position: positionAtOffset(
        pipelineText,
        pipelineText.lastIndexOf('ExistingTask') + 'ExistingTask'.length
      )
    })
    assert.deepEqual(
      pipelineCompletion.result
        .filter(item => item.kind === 7)
        .map(item => item.label)
        .sort(),
      ['Entry', 'ExistingTask', 'Other']
    )

    const interfaceCompletion = await client.request('textDocument/completion', {
      textDocument: { uri: pathToFileURL(interfaceFile).href },
      position: positionAtOffset(interfaceText, interfaceText.lastIndexOf('Adb') + 'Adb'.length)
    })
    assert.deepEqual(interfaceCompletion.result.map(item => item.label).sort(), ['Adb', 'Win32'])

    const pipelineReferences = await client.request('textDocument/references', {
      textDocument: { uri: pathToFileURL(pipelineFile).href },
      position: positionAtOffset(pipelineText, pipelineText.indexOf('ExistingTask') + 1),
      context: { includeDeclaration: true }
    })
    assert.equal(pipelineReferences.result.length, 3)
    const pipelineReferencesOnly = await client.request('textDocument/references', {
      textDocument: { uri: pathToFileURL(pipelineFile).href },
      position: positionAtOffset(pipelineText, pipelineText.indexOf('ExistingTask') + 1),
      context: { includeDeclaration: false }
    })
    assert.equal(pipelineReferencesOnly.result.length, 2)

    const interfaceReferences = await client.request('textDocument/references', {
      textDocument: { uri: pathToFileURL(interfaceFile).href },
      position: positionAtOffset(interfaceText, interfaceText.indexOf('Adb') + 1),
      context: { includeDeclaration: true }
    })
    assert.equal(interfaceReferences.result.length, 2)
    const interfaceReferencesOnly = await client.request('textDocument/references', {
      textDocument: { uri: pathToFileURL(interfaceFile).href },
      position: positionAtOffset(interfaceText, interfaceText.indexOf('Adb') + 1),
      context: { includeDeclaration: false }
    })
    assert.equal(interfaceReferencesOnly.result.length, 1)

    const symbols = await client.request('workspace/symbol', { query: 'existing' })
    assert.deepEqual(
      symbols.result.map(symbol => symbol.name),
      ['ExistingTask']
    )
    assert.equal(symbols.result[0].kind, 5)
    assert.match(symbols.result[0].containerName, /^tasks\.json:\d+$/)

    const pipelineLenses = await client.request('textDocument/codeLens', {
      textDocument: { uri: pathToFileURL(pipelineFile).href }
    })
    assert.deepEqual(pipelineLenses.result.map(lens => lens.command.title).sort(), [
      '0 references',
      '0 references',
      '2 references'
    ])
    const interfaceLenses = await client.request('textDocument/codeLens', {
      textDocument: { uri: pathToFileURL(interfaceFile).href }
    })
    assert.deepEqual(
      interfaceLenses.result.map(lens => lens.command.title),
      ['Active resource']
    )

    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})

test('provides task documentation and locale inlay hints', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-lsp-inlay-'))
  let client
  try {
    const server = path.join(temp, 'server.mjs')
    await copyFile(builtServer, server)
    const workspace = path.join(temp, 'workspace')
    const pipelineDir = path.join(workspace, 'resource', 'pipeline')
    const languageDir = path.join(workspace, 'lang')
    const pipelineFile = path.join(pipelineDir, 'tasks.json')
    await mkdir(pipelineDir, { recursive: true })
    await mkdir(languageDir, { recursive: true })
    await writeFile(
      path.join(workspace, 'interface.json'),
      JSON.stringify({
        resource: [{ name: 'Default', path: 'resource' }],
        languages: { English: 'lang/en.json' }
      })
    )
    await writeFile(path.join(languageDir, 'en.json'), JSON.stringify({ greeting: 'Hello' }))
    const pipelineText = JSON.stringify(
      {
        DocumentedTask: { doc: 'Helpful task' },
        Entry: {
          next: ['DocumentedTask'],
          focus: { tip: '$greeting' }
        }
      },
      null,
      2
    )
    await writeFile(pipelineFile, pipelineText)

    client = new LspClient(server, temp)
    await client.request('initialize', {
      processId: process.pid,
      rootUri: pathToFileURL(workspace).href,
      capabilities: {},
      workspaceFolders: null
    })
    client.send({ jsonrpc: '2.0', method: 'initialized', params: {} })
    await client.waitFor(
      message =>
        message.method === 'window/logMessage' &&
        message.params.message === 'maa-lsp: loaded 1 interface project'
    )
    const lines = pipelineText.split('\n')
    const hints = await client.request('textDocument/inlayHint', {
      textDocument: { uri: pathToFileURL(pipelineFile).href },
      range: {
        start: { line: 0, character: 0 },
        end: { line: lines.length - 1, character: lines.at(-1).length }
      }
    })
    assert.deepEqual(hints.result.map(hint => hint.label).sort(), ['Hello', 'Helpful task'])

    await client.shutdown()
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})
