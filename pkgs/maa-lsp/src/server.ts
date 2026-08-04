import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import {
  DiagnosticSeverity,
  type Diagnostic as LspDiagnostic,
  Range,
  TextDocumentSyncKind,
  createConnection
} from 'vscode-languageserver/node.js'
import { URI } from 'vscode-uri'

import {
  type AbsolutePath,
  FsContentLoader,
  FsContentWatcher,
  InterfaceBundle,
  type Diagnostic as MaaDiagnostic,
  type RelativePath,
  buildDiagnosticMessage,
  performDiagnostic
} from '@nekosu/maa-pipeline-manager'

function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: NodeJS.Timeout | undefined
  return (...args: A) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => fn(...args), ms)
  }
}

function computeLineStarts(content: string): number[] {
  const starts = [0]
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) {
      starts.push(i + 1)
    }
  }
  return starts
}

class PositionResolver {
  private cache = new Map<string, number[]>()

  reset() {
    this.cache.clear()
  }

  async resolve(file: string, offset: number): Promise<[number, number]> {
    let starts = this.cache.get(file)
    if (!starts) {
      let content: string
      try {
        content = await fs.readFile(file, 'utf8')
      } catch {
        return [0, 0]
      }
      starts = computeLineStarts(content)
      this.cache.set(file, starts)
    }
    let lo = 0
    let hi = starts.length - 1
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1
      if (starts[mid] <= offset) {
        lo = mid
      } else {
        hi = mid - 1
      }
    }
    return [lo, offset - starts[lo]]
  }
}

const connection = createConnection()

let workspaceRoot = ''
let bundle: InterfaceBundle | undefined
const resolver = new PositionResolver()
const publishedUris = new Set<string>()

const schedulePublish = debounce(publishDiagnostics, 500)

async function findResourceDir(
  root: string
): Promise<{ dir: string; interfaceFile: string } | null> {
  const names = ['interface.json', 'interface.jsonc']
  for (const dir of [root, path.join(root, 'resource')]) {
    for (const name of names) {
      if (existsSync(path.join(dir, name))) {
        return { dir, interfaceFile: name }
      }
    }
  }
  return null
}

async function setupBundle(rootUri: string | undefined | null) {
  await teardownBundle()
  const root = rootUri ? URI.parse(rootUri).fsPath : process.cwd()
  workspaceRoot = root
  const found = await findResourceDir(root)
  if (!found) {
    connection.console.warn(`maa-lsp: no interface.json found under ${root}; diagnostics disabled`)
    clearAllDiagnostics()
    return
  }
  bundle = new InterfaceBundle(
    new FsContentLoader(),
    new FsContentWatcher(),
    false,
    found.dir as AbsolutePath,
    found.interfaceFile as RelativePath,
    undefined
  )
  bundle.on('pipelineChanged', schedulePublish)
  bundle.on('interfaceChanged', schedulePublish)
  bundle.on('importChanged', schedulePublish)
  bundle.on('slaveInterfaceChanged', schedulePublish)
  bundle.on('bundleReloaded', schedulePublish)
  bundle.on('localeChanged', schedulePublish)
  await bundle.load()
  void publishDiagnostics()
}

async function teardownBundle() {
  bundle?.stop()
  bundle = undefined
}

function clearAllDiagnostics() {
  for (const uri of publishedUris) {
    connection.sendDiagnostics({ uri, diagnostics: [] })
  }
  publishedUris.clear()
}

async function publishDiagnostics() {
  if (!bundle) {
    return
  }
  resolver.reset()
  try {
    await bundle.flush(true)
  } catch (err) {
    connection.console.warn(`maa-lsp: bundle.flush failed: ${String(err)}`)
  }
  const diags = performDiagnostic(bundle, {})
  const byFile = new Map<string, LspDiagnostic[]>()
  for (const diag of diags) {
    const [start, end, brief] = await buildDiagnosticMessage(
      workspaceRoot as AbsolutePath,
      diag,
      (file, offset) => resolver.resolve(file, offset),
      {}
    )
    const list = byFile.get(diag.file) ?? []
    list.push({
      severity: diag.level === 'warning' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
      range: Range.create(start[0], start[1], end[0], end[1]),
      message: brief,
      source: 'maa'
    })
    byFile.set(diag.file, list)
  }
  const nextUris = new Set<string>()
  for (const [file, list] of byFile) {
    const uri = URI.file(file).toString()
    nextUris.add(uri)
    connection.sendDiagnostics({ uri, diagnostics: list })
  }
  for (const uri of publishedUris) {
    if (!nextUris.has(uri)) {
      connection.sendDiagnostics({ uri, diagnostics: [] })
    }
  }
  publishedUris.clear()
  for (const uri of nextUris) {
    publishedUris.add(uri)
  }
}

connection.onInitialize(params => {
  const rootUri = params.rootUri ?? params.workspaceFolders?.[0]?.uri ?? null
  void setupBundle(rootUri).catch(err => {
    connection.console.error(`maa-lsp: setupBundle failed: ${String(err)}`)
  })
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full
    }
  }
})

connection.onShutdown(() => {
  void teardownBundle()
})

connection.listen()
