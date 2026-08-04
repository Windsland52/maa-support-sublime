import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import {
  type Definition,
  DiagnosticSeverity,
  Hover,
  Location,
  type Diagnostic as LspDiagnostic,
  MarkupKind,
  Range,
  TextDocumentSyncKind,
  createConnection
} from 'vscode-languageserver/node.js'
import { URI } from 'vscode-uri'

import {
  type AbsolutePath,
  type AnchorName,
  FsContentLoader,
  FsContentWatcher,
  InterfaceBundle,
  type TaskDeclInfo,
  type TaskName,
  type TaskRefInfo,
  buildDiagnosticMessage,
  extractTaskRef,
  findDeclRef,
  isAnchorRef,
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

function lineOfStarts(starts: number[], offset: number): number {
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
  return lo
}

class PositionResolver {
  private cache = new Map<string, number[]>()

  reset() {
    this.cache.clear()
  }

  private async getStarts(file: string): Promise<number[] | null> {
    let starts = this.cache.get(file)
    if (starts) {
      return starts
    }
    let content: string
    try {
      content = await fs.readFile(file, 'utf8')
    } catch {
      return null
    }
    starts = computeLineStarts(content)
    this.cache.set(file, starts)
    return starts
  }

  async resolve(file: string, offset: number): Promise<[number, number]> {
    const starts = await this.getStarts(file)
    if (!starts) {
      return [0, 0]
    }
    const line = lineOfStarts(starts, offset)
    return [line, offset - starts[line]]
  }

  async positionToOffset(file: string, line: number, character: number): Promise<number> {
    const starts = await this.getStarts(file)
    if (!starts) {
      return 0
    }
    const base = starts[line] ?? starts[starts.length - 1] ?? 0
    return base + character
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
    found.interfaceFile as AbsolutePath,
    undefined
  )
  bundle.on('pipelineChanged', schedulePublish)
  bundle.on('interfaceChanged', schedulePublish)
  bundle.on('importChanged', schedulePublish)
  bundle.on('slaveInterfaceChanged', schedulePublish)
  bundle.on('bundleReloaded', schedulePublish)
  bundle.on('localeChanged', schedulePublish)
  await bundle.load()
  const controller = bundle.allControllerNames()[0] ?? ''
  const resource = bundle.allResourceNames(controller)[0] ?? ''
  if (resource) {
    await bundle.switchActive(controller, resource).catch(err => {
      connection.console.warn(`maa-lsp: switchActive failed: ${String(err)}`)
    })
  }
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

function makeDecls(
  decls: TaskDeclInfo[],
  _refs: TaskRefInfo[],
  decl: TaskDeclInfo | null,
  ref: TaskRefInfo | null
): TaskDeclInfo[] {
  if (decl) {
    if (decl.type === 'task.decl') {
      return decls.filter(d => d.type === 'task.decl' && d.task === decl.task)
    } else if (decl.type === 'task.anchor') {
      return decls.filter(d => d.type === 'task.anchor' && d.anchor === decl.anchor)
    } else if (decl.type === 'task.sub_reco') {
      return decls.filter(
        d => d.type === 'task.sub_reco' && d.name === decl.name && d.task === decl.task
      )
    } else if (decl.type === 'task.locale') {
      return decls.filter(d => d.type === 'task.locale' && d.key === decl.key)
    }
  } else if (ref) {
    const task = extractTaskRef(ref)
    if (task && 'target' in ref) {
      return decls.filter(d => d.type === 'task.decl' && d.task === ref.target)
    } else if (isAnchorRef(ref)) {
      return decls.filter(
        d => d.type === 'task.anchor' && d.anchor === (ref.target as string as AnchorName)
      )
    } else if (ref.type === 'task.roi') {
      return decls.filter(
        d => d.type === 'task.sub_reco' && d.name === ref.target && d.task === ref.task
      )
    } else if (ref.type === 'task.locale') {
      return decls.filter(d => d.type === 'task.locale' && d.key === ref.target)
    }
  }
  return []
}

async function toLocation(file: string, offset: number, length: number): Promise<Location> {
  const [sl, sc] = await resolver.resolve(file, offset)
  const [el, ec] = await resolver.resolve(file, offset + length)
  return Location.create(URI.file(file).toString(), Range.create(sl, sc, el, ec))
}

async function getTaskHover(task: TaskName): Promise<string> {
  if (!bundle || task.length === 0) {
    return ''
  }
  const topLayer = bundle.topLayer
  const taskInfos = topLayer.getTask(task)
  const parts: string[] = []
  for (const { layer, infos } of taskInfos) {
    for (const info of infos) {
      let content: string
      try {
        content = await fs.readFile(info.file, 'utf8')
      } catch {
        continue
      }
      const starts = computeLineStarts(content)
      const beginLine = lineOfStarts(starts, info.prop.offset)
      const endLine = lineOfStarts(starts, info.data.offset + info.data.length)
      const slice = content
        .split('\n')
        .slice(beginLine, endLine + 1)
        .join('\n')
      parts.push(`${path.relative(workspaceRoot, layer.root) || '.'}

\`\`\`json
${slice}
\`\`\`
`)
    }
  }
  const final = bundle.evalTask(task)
  if (final && Object.keys(final).length > 0) {
    parts.push(`merged

\`\`\`json
${JSON.stringify(final, null, 2)}
\`\`\`
`)
  }
  return parts.join('\n\n')
}

async function locateAndResolve(
  uri: string,
  line: number,
  character: number
): Promise<{ file: string; offset: number } | null> {
  if (!bundle) {
    return null
  }
  await bundle.flush(true)
  const file = URI.parse(uri).fsPath as AbsolutePath
  const layerInfo = bundle.locateLayer(file)
  if (!layerInfo) {
    return null
  }
  const offset = await resolver.positionToOffset(file, line, character)
  return { file, offset }
}

connection.onInitialize(params => {
  const rootUri = params.rootUri ?? params.workspaceFolders?.[0]?.uri ?? null
  void setupBundle(rootUri).catch(err => {
    connection.console.error(`maa-lsp: setupBundle failed: ${String(err)}`)
  })
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      definitionProvider: true,
      hoverProvider: true
    }
  }
})

connection.onDefinition(async params => {
  const ctx = await locateAndResolve(
    params.textDocument.uri,
    params.position.line,
    params.position.character
  )
  if (!ctx || !bundle) {
    return null
  }
  const layerInfo = bundle.locateLayer(ctx.file as AbsolutePath)
  if (!layerInfo) {
    return null
  }
  const [layer, fileName, isDefault] = layerInfo
  const topLayer = bundle.topLayer
  const decls = layer.mergedDecls.filter(d => d.file === fileName)
  const refs = layer.mergedRefs.filter(r => r.file === fileName)
  const decl = findDeclRef(decls, ctx.offset)
  const ref = findDeclRef(refs, ctx.offset)
  const allDecls = topLayer.mergedAllDecls
  const allRefs = topLayer.mergedAllRefs
  if (decl) {
    if (isDefault && decl.type === 'task.decl') {
      return null
    }
    const matched = makeDecls(allDecls, allRefs, decl, ref)
    return Promise.all(matched.map(d => toLocation(d.file, d.location.offset, d.location.length)))
  }
  if (ref) {
    const matched = makeDecls(allDecls, allRefs, decl, ref)
    return Promise.all(matched.map(d => toLocation(d.file, d.location.offset, d.location.length)))
  }
  return null
})

connection.onHover(async params => {
  const ctx = await locateAndResolve(
    params.textDocument.uri,
    params.position.line,
    params.position.character
  )
  if (!ctx || !bundle) {
    return null
  }
  const layerInfo = bundle.locateLayer(ctx.file as AbsolutePath)
  if (!layerInfo) {
    return null
  }
  const [layer, fileName, isDefault] = layerInfo
  const decls = layer.mergedDecls.filter(d => d.file === fileName)
  const refs = layer.mergedRefs.filter(r => r.file === fileName)
  const decl = findDeclRef(decls, ctx.offset)
  const ref = findDeclRef(refs, ctx.offset)
  let task: TaskName | null = null
  if (decl) {
    if (decl.type === 'task.decl') {
      if (isDefault) {
        return null
      }
      task = decl.task
    }
  } else if (ref) {
    task = extractTaskRef(ref)
  }
  if (!task) {
    return null
  }
  const content = await getTaskHover(task)
  if (!content) {
    return null
  }
  return { contents: { kind: MarkupKind.Markdown, value: content } }
})

connection.onShutdown(() => {
  void teardownBundle()
})

connection.listen()
