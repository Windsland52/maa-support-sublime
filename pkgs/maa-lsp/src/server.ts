import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  type Definition,
  DiagnosticSeverity,
  FileChangeType,
  Hover,
  type InitializeParams,
  Location,
  type Diagnostic as LspDiagnostic,
  MarkupKind,
  MessageType,
  Range,
  ShowMessageNotification,
  TextDocumentSyncKind,
  TextDocuments,
  createConnection
} from 'vscode-languageserver/node.js'
import { URI } from 'vscode-uri'

import {
  type AbsolutePath,
  type AnchorName,
  type IContentWatcherController,
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

import { MAATOOLS_CONFIG_FILE, type MaaToolsConfig, loadMaaToolsConfig } from './config'
import { LspContentLoader, LspContentWatcher } from './content'
import { type ResourceRoot, isInterfaceFile, locateResourceRoots } from './workspace'

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

  constructor(private readonly loader: LspContentLoader) {}

  reset() {
    this.cache.clear()
  }

  private async getStarts(file: string): Promise<number[] | null> {
    let starts = this.cache.get(file)
    if (starts) {
      return starts
    }
    const content = await this.loader.get(file)
    if (content === null) {
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

type ProjectBundle = {
  root: ResourceRoot
  bundle: InterfaceBundle
  config: MaaToolsConfig | null
}

type InterfaceConfig = {
  controller?: unknown
  resource?: unknown
}

const connection = createConnection()
const documents = new TextDocuments(TextDocument)
documents.listen(connection)

const loader = new LspContentLoader(documents)
const watcher = new LspContentWatcher(documents)
const resolver = new PositionResolver(loader)

let workspaceRoots: string[] = []
let clientSupportsWorkspaceFolders = false
let projects: ProjectBundle[] = []
let configWatchers: IContentWatcherController[] = []
let refreshQueue = Promise.resolve()
let selectionQueue = Promise.resolve()
let publishQueue = Promise.resolve()
const publishedUris = new Set<string>()

function clearAllDiagnostics() {
  for (const uri of publishedUris) {
    connection.sendDiagnostics({ uri, diagnostics: [] })
  }
  publishedUris.clear()
}

async function teardownProjects() {
  for (const configWatcher of configWatchers) {
    configWatcher.stop()
  }
  configWatchers = []
  for (const project of projects) {
    project.bundle.stop()
  }
  projects = []
  clearAllDiagnostics()
}

async function loadInterfaceConfig(
  root: ResourceRoot
): Promise<{ controller: string; resource: string }> {
  let config: InterfaceConfig = {}
  try {
    config = JSON.parse(await fs.readFile(root.configFile, 'utf8')) as InterfaceConfig
  } catch {
    // The extension treats a missing or invalid config as an empty selection.
  }

  let controller = ''
  if (typeof config.controller === 'string') {
    controller = config.controller
  } else if (
    typeof config.controller === 'object' &&
    config.controller !== null &&
    'name' in config.controller &&
    typeof config.controller.name === 'string'
  ) {
    controller = config.controller.name
  }
  return {
    controller,
    resource: typeof config.resource === 'string' ? config.resource : ''
  }
}

async function selectConfiguredResource(project: ProjectBundle) {
  const config = await loadInterfaceConfig(project.root)
  const resources = project.bundle.allResourceNames()
  const resource = resources.includes(config.resource) ? config.resource : (resources[0] ?? '')
  await project.bundle.switchActive(config.controller, resource)
}

async function isMaaAssistantArknights(workspaceRoot: string): Promise<boolean> {
  try {
    return (await fs.stat(path.join(workspaceRoot, 'src', 'MaaCore'))).isDirectory()
  } catch {
    return false
  }
}

function queuePublishDiagnostics() {
  publishQueue = publishQueue.then(publishDiagnostics).catch(error => {
    connection.console.error(`maa-lsp: diagnostics failed: ${String(error)}`)
  })
}

const schedulePublish = debounce(queuePublishDiagnostics, 500)

function queueConfigRefresh(file: string) {
  connection.console.info(`maa-lsp: reloading changed ${path.basename(file)}`)
  queueWorkspaceRefresh()
}

async function watchMaaToolsConfig(file: string) {
  let ready = false
  const changed = () => {
    if (ready) {
      queueConfigRefresh(file)
    }
  }
  const controller = await watcher.watch(file, true, {
    filter: () => true,
    fileAdded: changed,
    fileChanged: changed,
    fileDeleted: changed
  })
  ready = true
  configWatchers.push(controller)
}

function queueInterfaceSelection(project: ProjectBundle, file: string) {
  selectionQueue = selectionQueue
    .then(async () => {
      await selectConfiguredResource(project)
      connection.console.info(`maa-lsp: reloaded ${path.basename(file)} for ${project.root.dir}`)
      queuePublishDiagnostics()
    })
    .catch(error => {
      connection.console.error(`maa-lsp: failed to reload ${path.basename(file)}: ${String(error)}`)
    })
}

async function watchInterfaceConfig(project: ProjectBundle) {
  const file = path.join(project.root.dir, 'config', 'maa_pi_config.json')
  let ready = false
  const changed = () => {
    if (ready) {
      queueInterfaceSelection(project, file)
    }
  }
  const controller = await watcher.watch(file, true, {
    filter: () => true,
    fileAdded: changed,
    fileChanged: changed,
    fileDeleted: changed
  })
  ready = true
  configWatchers.push(controller)
}

async function setupProjects(roots: string[]) {
  await teardownProjects()

  const found = await locateResourceRoots(roots, (dir, error) => {
    connection.console.warn(`maa-lsp: cannot scan ${dir}: ${String(error)}`)
  })
  const nextProjects: ProjectBundle[] = []
  const configs = new Map<string, MaaToolsConfig | null>()
  const maaModes = new Map<string, boolean>()

  for (const workspaceRoot of new Set(found.map(root => root.workspaceRoot))) {
    const loaded = await loadMaaToolsConfig(workspaceRoot)
    configs.set(workspaceRoot, loaded.config)
    maaModes.set(workspaceRoot, await isMaaAssistantArknights(workspaceRoot))
    await watchMaaToolsConfig(loaded.file)
    if (loaded.error) {
      const detail = loaded.error instanceof Error ? loaded.error.message : String(loaded.error)
      const message = `maa-lsp: failed to load ${loaded.file}: ${detail}`
      connection.console.error(message)
      connection.sendNotification(ShowMessageNotification.type, {
        type: MessageType.Error,
        message
      })
    }
    if (loaded.config) {
      connection.console.info(`maa-lsp: loaded ${MAATOOLS_CONFIG_FILE} from ${workspaceRoot}`)
    }
  }

  for (const root of found) {
    const config = configs.get(root.workspaceRoot) ?? null
    const bundle = new InterfaceBundle(
      loader,
      watcher,
      maaModes.get(root.workspaceRoot) ?? false,
      root.dir as AbsolutePath,
      root.interfaceFile as AbsolutePath,
      config?.parser
    )
    const project = { root, bundle, config }
    for (const event of [
      'pipelineChanged',
      'interfaceChanged',
      'importChanged',
      'slaveInterfaceChanged',
      'bundleReloaded',
      'localeChanged'
    ] as const) {
      bundle.on(event, schedulePublish)
    }

    try {
      await bundle.load()
      await selectConfiguredResource(project)
      await watchInterfaceConfig(project)
      nextProjects.push(project)
    } catch (error) {
      bundle.stop()
      connection.console.warn(
        `maa-lsp: failed to load ${path.join(root.dir, root.interfaceFile)}: ${String(error)}`
      )
    }
  }

  projects = nextProjects.sort((a, b) => b.root.dir.length - a.root.dir.length)
  connection.console.info(
    `maa-lsp: loaded ${projects.length} interface project${projects.length === 1 ? '' : 's'}`
  )
  queuePublishDiagnostics()
}

function queueWorkspaceRefresh() {
  const roots = [...workspaceRoots]
  refreshQueue = refreshQueue
    .then(() => setupProjects(roots))
    .catch(error => {
      connection.console.error(`maa-lsp: workspace refresh failed: ${String(error)}`)
    })
}

function workspaceRootsFromInitialize(params: InitializeParams): string[] {
  const uris = params.workspaceFolders?.length
    ? params.workspaceFolders.map(folder => folder.uri)
    : params.rootUri
      ? [params.rootUri]
      : []
  const roots = uris.map(uri => URI.parse(uri).fsPath)
  if (roots.length === 0 && params.rootPath) {
    roots.push(params.rootPath)
  }
  if (roots.length === 0) {
    roots.push(process.cwd())
  }
  const normalized = roots.map(root => path.resolve(root))
  return normalized.filter((root, index) => normalized.indexOf(root) === index)
}

async function publishDiagnostics() {
  resolver.reset()
  const byFile = new Map<string, LspDiagnostic[]>()

  for (const project of projects) {
    try {
      await project.bundle.flush(true)
    } catch (error) {
      connection.console.warn(
        `maa-lsp: bundle.flush failed for ${project.root.dir}: ${String(error)}`
      )
    }
    const diags = performDiagnostic(project.bundle, {})
    for (const diag of diags) {
      const override = project.config?.check?.override?.[diag.type]
      if (override === 'ignore') {
        continue
      }
      const effective = override ? { ...diag, level: override } : diag
      const [start, end, brief] = await buildDiagnosticMessage(
        project.root.workspaceRoot as AbsolutePath,
        effective,
        (file, offset) => resolver.resolve(file, offset),
        {}
      )
      const list = byFile.get(effective.file) ?? []
      list.push({
        severity:
          effective.level === 'warning' ? DiagnosticSeverity.Warning : DiagnosticSeverity.Error,
        range: Range.create(start[0], start[1], end[0], end[1]),
        message: brief,
        source: 'maa'
      })
      byFile.set(effective.file, list)
    }
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

async function getTaskHover(project: ProjectBundle, task: TaskName): Promise<string> {
  if (task.length === 0) {
    return ''
  }
  const taskInfos = project.bundle.topLayer.getTask(task)
  const parts: string[] = []
  for (const { layer, infos } of taskInfos) {
    for (const info of infos) {
      const content = await loader.get(info.file)
      if (content === null) {
        continue
      }
      const starts = computeLineStarts(content)
      const beginLine = lineOfStarts(starts, info.prop.offset)
      const endLine = lineOfStarts(starts, info.data.offset + info.data.length)
      const slice = content
        .split('\n')
        .slice(beginLine, endLine + 1)
        .join('\n')
      parts.push(`${path.relative(project.root.workspaceRoot, layer.root) || '.'}

\`\`\`json
${slice}
\`\`\`
`)
    }
  }
  const final = project.bundle.evalTask(task)
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
): Promise<{ project: ProjectBundle; file: string; offset: number } | null> {
  resolver.reset()
  const file = URI.parse(uri).fsPath as AbsolutePath
  for (const project of projects) {
    await project.bundle.flush(true)
    if (!project.bundle.locateLayer(file)) {
      continue
    }
    const offset = await resolver.positionToOffset(file, line, character)
    return { project, file, offset }
  }
  return null
}

connection.onInitialize(params => {
  workspaceRoots = workspaceRootsFromInitialize(params)
  clientSupportsWorkspaceFolders = params.capabilities.workspace?.workspaceFolders === true
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      definitionProvider: true,
      hoverProvider: true,
      workspace: {
        workspaceFolders: {
          supported: true,
          changeNotifications: true
        }
      }
    }
  }
})

connection.onInitialized(() => {
  if (clientSupportsWorkspaceFolders) {
    connection.workspace.onDidChangeWorkspaceFolders(event => {
      const removed = new Set(
        event.removed.map(folder => path.resolve(URI.parse(folder.uri).fsPath))
      )
      workspaceRoots = workspaceRoots.filter(root => !removed.has(path.resolve(root)))
      for (const folder of event.added) {
        const root = path.resolve(URI.parse(folder.uri).fsPath)
        if (!workspaceRoots.includes(root)) {
          workspaceRoots.push(root)
        }
      }
      queueWorkspaceRefresh()
    })
  }
  queueWorkspaceRefresh()
})

connection.onDidChangeWatchedFiles(params => {
  if (
    params.changes.some(
      change =>
        change.type !== FileChangeType.Changed && isInterfaceFile(URI.parse(change.uri).fsPath)
    )
  ) {
    queueWorkspaceRefresh()
  }
})

connection.onDefinition(async params => {
  const ctx = await locateAndResolve(
    params.textDocument.uri,
    params.position.line,
    params.position.character
  )
  if (!ctx) {
    return null
  }
  const bundle = ctx.project.bundle
  const layerInfo = bundle.locateLayer(ctx.file as AbsolutePath)
  if (!layerInfo) {
    return null
  }
  const [layer, fileName, isDefault] = layerInfo
  const decls = layer.mergedDecls.filter(d => d.file === fileName)
  const refs = layer.mergedRefs.filter(r => r.file === fileName)
  const decl = findDeclRef(decls, ctx.offset)
  const ref = findDeclRef(refs, ctx.offset)
  const allDecls = bundle.topLayer.mergedAllDecls
  const allRefs = bundle.topLayer.mergedAllRefs
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
  if (!ctx) {
    return null
  }
  const bundle = ctx.project.bundle
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
  const content = await getTaskHover(ctx.project, task)
  if (!content) {
    return null
  }
  return { contents: { kind: MarkupKind.Markdown, value: content } }
})

connection.onShutdown(async () => {
  await refreshQueue
  await publishQueue
  await teardownProjects()
})

connection.listen()
