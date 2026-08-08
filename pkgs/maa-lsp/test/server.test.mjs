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
    assert.equal(initialized.result.capabilities.definitionProvider, true)
    assert.equal(initialized.result.capabilities.hoverProvider, true)

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
