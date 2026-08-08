import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  type CompletionItem,
  CompletionItemKind,
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
  TextEdit,
  createConnection
} from 'vscode-languageserver/node.js'
import { URI } from 'vscode-uri'

import {
  type AbsolutePath,
  type AnchorName,
  type IContentWatcherController,
  InterfaceBundle,
  type InterfaceDeclInfo,
  type InterfaceInfo,
  type InterfaceRefInfo,
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
const publishedDiagnostics = new Map<string, string>()

function clearAllDiagnostics() {
  for (const uri of publishedDiagnostics.keys()) {
    connection.sendDiagnostics({ uri, diagnostics: [] })
  }
  publishedDiagnostics.clear()
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

  const nextDiagnostics = new Map<string, string>()
  for (const [file, list] of byFile) {
    const uri = URI.file(file).toString()
    const fingerprint = JSON.stringify(list)
    nextDiagnostics.set(uri, fingerprint)
    if (publishedDiagnostics.get(uri) !== fingerprint) {
      connection.sendDiagnostics({ uri, diagnostics: list })
    }
  }
  for (const uri of publishedDiagnostics.keys()) {
    if (!nextDiagnostics.has(uri)) {
      connection.sendDiagnostics({ uri, diagnostics: [] })
    }
  }
  publishedDiagnostics.clear()
  for (const [uri, fingerprint] of nextDiagnostics) {
    publishedDiagnostics.set(uri, fingerprint)
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

function makeRefs(
  _decls: TaskDeclInfo[],
  refs: TaskRefInfo[],
  decl: TaskDeclInfo | null,
  ref: TaskRefInfo | null
): TaskRefInfo[] {
  const findTask = (task: TaskName) =>
    refs.filter(candidate => {
      if (
        candidate.type === 'task.anchor' ||
        candidate.type === 'task.reco' ||
        candidate.type === 'task.color_filter' ||
        candidate.type === 'task.custom_task' ||
        candidate.type === 'task.entry'
      ) {
        return candidate.target === task
      }
      if (candidate.type === 'task.next' || candidate.type === 'task.target') {
        return candidate.target === task && !candidate.attrs.attrs.Anchor
      }
      if (candidate.type === 'task.roi' && !candidate.attrs.attrs.Anchor) {
        const previous = candidate.prev.some(
          previousDecl => previousDecl.value === candidate.target
        )
        return !previous && candidate.target === task
      }
      return false
    })

  if (decl) {
    if (decl.type === 'task.decl') {
      return findTask(decl.task)
    }
    if (decl.type === 'task.anchor') {
      return refs.filter(candidate => isAnchorRef(candidate) && candidate.target === decl.anchor)
    }
    if (decl.type === 'task.sub_reco') {
      return refs.filter(
        candidate =>
          candidate.type === 'task.roi' &&
          candidate.target === decl.name &&
          candidate.task === decl.task
      )
    }
    if (decl.type === 'task.locale') {
      return refs.filter(
        candidate => candidate.type === 'task.locale' && candidate.target === decl.key
      )
    }
  } else if (ref) {
    const task = extractTaskRef(ref)
    if (task) {
      return findTask(task)
    }
    if (isAnchorRef(ref)) {
      return refs.filter(candidate => isAnchorRef(candidate) && candidate.target === ref.target)
    }
    if (ref.type === 'task.roi') {
      return refs.filter(
        candidate =>
          candidate.type === 'task.roi' &&
          candidate.target === ref.target &&
          candidate.task === ref.task
      )
    }
    if (ref.type === 'task.locale') {
      return refs.filter(
        candidate => candidate.type === 'task.locale' && candidate.target === ref.target
      )
    }
  }
  return []
}

function makeInterfaceDecls(
  index: InterfaceInfo,
  decl: InterfaceDeclInfo | null,
  ref: InterfaceRefInfo | null
): InterfaceDeclInfo[] {
  if (decl) {
    if (
      decl.type === 'interface.controller' ||
      decl.type === 'interface.resource' ||
      decl.type === 'interface.group' ||
      decl.type === 'interface.task' ||
      decl.type === 'interface.option'
    ) {
      return index.decls.filter(
        candidate => candidate.type === decl.type && candidate.name === decl.name
      )
    }
    if (decl.type === 'interface.case' || decl.type === 'interface.input') {
      return index.decls.filter(
        candidate =>
          candidate.type === decl.type &&
          candidate.name === decl.name &&
          candidate.option === decl.option
      )
    }
  } else if (ref) {
    if (
      ref.type === 'interface.controller' ||
      ref.type === 'interface.resource' ||
      ref.type === 'interface.group' ||
      ref.type === 'interface.task' ||
      ref.type === 'interface.option'
    ) {
      return index.decls.filter(
        candidate => candidate.type === ref.type && candidate.name === ref.target
      )
    }
    if (ref.type === 'interface.case' || ref.type === 'interface.input') {
      return index.decls.filter(
        candidate =>
          candidate.type === ref.type &&
          candidate.name === ref.target &&
          candidate.option === ref.option
      )
    }
  }
  return []
}

function makeInterfaceRefs(
  index: InterfaceInfo,
  decl: InterfaceDeclInfo | null,
  ref: InterfaceRefInfo | null
): InterfaceRefInfo[] {
  if (decl) {
    if (
      decl.type === 'interface.controller' ||
      decl.type === 'interface.resource' ||
      decl.type === 'interface.group' ||
      decl.type === 'interface.task' ||
      decl.type === 'interface.option'
    ) {
      return index.refs.filter(
        candidate => candidate.type === decl.type && candidate.target === decl.name
      )
    }
    if (decl.type === 'interface.case' || decl.type === 'interface.input') {
      return index.refs.filter(
        candidate =>
          candidate.type === decl.type &&
          candidate.target === decl.name &&
          candidate.option === decl.option
      )
    }
  } else if (ref) {
    if (
      ref.type === 'interface.controller' ||
      ref.type === 'interface.resource' ||
      ref.type === 'interface.group' ||
      ref.type === 'interface.task' ||
      ref.type === 'interface.option'
    ) {
      return index.refs.filter(
        candidate => candidate.type === ref.type && candidate.target === ref.target
      )
    }
    if (ref.type === 'interface.case' || ref.type === 'interface.input') {
      return index.refs.filter(
        candidate =>
          candidate.type === ref.type &&
          candidate.target === ref.target &&
          candidate.option === ref.option
      )
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

type CompletionSpec = {
  kind: 'task' | 'anchor' | 'image' | 'locale'
  startDelta: number
  prefixes?: string[]
  colorMatchOnly?: boolean
}

function completionSpec(ref: TaskRefInfo): CompletionSpec | null {
  switch (ref.type) {
    case 'task.next':
      if (ref.objMode) {
        return { kind: ref.attrs.attrs.Anchor ? 'anchor' : 'task', startDelta: 1 }
      }
      if (ref.attrs.attrs.Anchor) {
        return { kind: 'anchor', startDelta: 1 + ref.attrs.offset }
      }
      return {
        kind: 'task',
        startDelta: 1 + ref.attrs.offset,
        prefixes: ref.attrs.attrs.JumpBack ? ['[Anchor]'] : ['[JumpBack]', '[Anchor]']
      }
    case 'task.target':
    case 'task.roi':
      return {
        kind: ref.attrs.attrs.Anchor ? 'anchor' : 'task',
        startDelta: 1 + ref.attrs.offset,
        prefixes: ref.attrs.attrs.Anchor ? [] : ['[Anchor]']
      }
    case 'task.anchor':
    case 'task.reco':
    case 'task.custom_task':
    case 'task.entry':
      return { kind: 'task', startDelta: 1 }
    case 'task.color_filter':
      return { kind: 'task', startDelta: 1, colorMatchOnly: true }
    case 'task.custom_anchor':
      return { kind: 'anchor', startDelta: 1 }
    case 'task.template':
    case 'task.custom_template':
      return { kind: 'image', startDelta: 1 }
    case 'task.locale':
      return { kind: 'locale', startDelta: 2 }
    default:
      return null
  }
}

async function completionEditRange(
  file: string,
  offset: number,
  length: number,
  startDelta: number
): Promise<Range> {
  const [startLine, startCharacter] = await resolver.resolve(file, offset + startDelta)
  const [endLine, endCharacter] = await resolver.resolve(file, offset + length - 1)
  return Range.create(startLine, startCharacter, endLine, endCharacter)
}

function escapedStringContent(value: string): string {
  const escaped = JSON.stringify(value)
  return escaped.slice(1, -1)
}

async function completeInterface(
  project: ProjectBundle,
  file: string,
  offset: number
): Promise<CompletionItem[] | null> {
  const index = project.bundle.info
  const ref = findDeclRef(
    index.refs.filter(candidate => candidate.file === file),
    offset
  )
  if (!ref) {
    return null
  }

  let names: string[] | null = null
  if (
    ref.type === 'interface.controller' ||
    ref.type === 'interface.resource' ||
    ref.type === 'interface.group' ||
    ref.type === 'interface.task' ||
    ref.type === 'interface.option'
  ) {
    names = index.decls.filter(decl => decl.type === ref.type).map(decl => decl.name as string)
  } else if (ref.type === 'interface.case' || ref.type === 'interface.input') {
    if (ref.type === 'interface.input' && ref.offset !== undefined) {
      return null
    }
    names = index.decls
      .filter(decl => decl.type === ref.type && decl.option === ref.option)
      .map(decl => decl.name)
  }
  if (!names) {
    return null
  }

  const range = await completionEditRange(file, ref.location.offset, ref.location.length, 1)
  return [...new Set(names)].map(name => ({
    label: name,
    kind: CompletionItemKind.Reference,
    textEdit: TextEdit.replace(range, escapedStringContent(name))
  }))
}

async function completePipeline(
  project: ProjectBundle,
  file: string,
  offset: number
): Promise<CompletionItem[] | null> {
  const layerInfo = project.bundle.locateLayer(file as AbsolutePath)
  if (!layerInfo) {
    return null
  }
  const [layer, fileName] = layerInfo
  const ref = findDeclRef(
    layer.mergedRefs.filter(candidate => candidate.file === fileName),
    offset
  )
  if (!ref) {
    return null
  }
  const spec = completionSpec(ref)
  if (!spec) {
    return null
  }
  const range = await completionEditRange(
    file,
    ref.location.offset,
    ref.location.length,
    spec.startDelta
  )
  const items: CompletionItem[] = []
  for (const prefix of spec.prefixes ?? []) {
    items.push({
      label: prefix,
      kind: CompletionItemKind.Property,
      sortText: prefix === '[JumpBack]' ? '0_JumpBack' : '2_Anchor',
      textEdit: TextEdit.insert(range.start, prefix)
    })
  }

  if (spec.kind === 'task') {
    for (const task of layer.getTaskList()) {
      const brief = layer.getTaskBriefInfo(task)
      if (spec.colorMatchOnly && brief.reco !== 'ColorMatch') {
        continue
      }
      const doc = project.bundle.topLayer.getTaskDoc(task)
      items.push({
        label: task,
        kind: CompletionItemKind.Class,
        sortText: `1_${task}`,
        detail: [doc, brief.reco && `Reco: ${brief.reco}`, brief.act && `Act: ${brief.act}`]
          .filter(Boolean)
          .join('\n'),
        textEdit: TextEdit.replace(range, escapedStringContent(task))
      })
    }
  } else if (spec.kind === 'anchor') {
    for (const anchor of new Set(layer.getAnchorList().map(([name]) => name))) {
      items.push({
        label: anchor,
        kind: CompletionItemKind.Variable,
        textEdit: TextEdit.replace(range, escapedStringContent(anchor))
      })
    }
  } else if (spec.kind === 'image') {
    for (const [folder] of layer.getImageFolders()) {
      items.push({
        label: `${folder}/`,
        kind: CompletionItemKind.Folder,
        sortText: `0_${folder}/`,
        textEdit: TextEdit.replace(range, escapedStringContent(`${folder}/`))
      })
    }
    for (const image of layer.getImageList()) {
      items.push({
        label: image,
        kind: CompletionItemKind.File,
        sortText: `1_${image}`,
        textEdit: TextEdit.replace(range, escapedStringContent(image))
      })
    }
  } else {
    for (const key of project.bundle.langBundle.allKeys()) {
      items.push({
        label: key,
        kind: CompletionItemKind.Constant,
        textEdit: TextEdit.replace(range, escapedStringContent(key))
      })
    }
  }
  return items
}

connection.onInitialize(params => {
  workspaceRoots = workspaceRootsFromInitialize(params)
  clientSupportsWorkspaceFolders = params.capabilities.workspace?.workspaceFolders === true
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ['"', '[', ']', '$', '@', '#', '+', '^', '(']
      },
      definitionProvider: true,
      hoverProvider: true,
      referencesProvider: true,
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

connection.onCompletion(async params => {
  const ctx = await locateAndResolve(
    params.textDocument.uri,
    params.position.line,
    params.position.character
  )
  if (!ctx) {
    return null
  }
  return (
    (await completeInterface(ctx.project, ctx.file, ctx.offset)) ??
    (await completePipeline(ctx.project, ctx.file, ctx.offset))
  )
})

connection.onReferences(async params => {
  const ctx = await locateAndResolve(
    params.textDocument.uri,
    params.position.line,
    params.position.character
  )
  if (!ctx) {
    return null
  }

  const index = ctx.project.bundle.info
  const interfaceDecl = findDeclRef(
    index.decls.filter(candidate => candidate.file === ctx.file),
    ctx.offset
  )
  const interfaceRef = findDeclRef(
    index.refs.filter(candidate => candidate.file === ctx.file),
    ctx.offset
  )
  const interfaceDecls = makeInterfaceDecls(index, interfaceDecl, interfaceRef)
  const interfaceRefs = makeInterfaceRefs(index, interfaceDecl, interfaceRef)
  if (interfaceDecls.length > 0 || interfaceRefs.length > 0) {
    const matches = params.context.includeDeclaration
      ? [...interfaceDecls, ...interfaceRefs]
      : interfaceRefs
    return Promise.all(
      matches.map(match => toLocation(match.file, match.location.offset, match.location.length))
    )
  }

  const layerInfo = ctx.project.bundle.locateLayer(ctx.file as AbsolutePath)
  if (!layerInfo) {
    return null
  }
  const [layer, fileName, isDefault] = layerInfo
  const decls = layer.mergedDecls.filter(candidate => candidate.file === fileName)
  const refs = layer.mergedRefs.filter(candidate => candidate.file === fileName)
  const decl = findDeclRef(decls, ctx.offset)
  const ref = findDeclRef(refs, ctx.offset)
  if (isDefault && decl?.type === 'task.decl') {
    return null
  }
  const allDecls = ctx.project.bundle.topLayer.mergedAllDecls
  const allRefs = ctx.project.bundle.topLayer.mergedAllRefs
  const matchedDecls = makeDecls(allDecls, allRefs, decl, ref)
  const matchedRefs = makeRefs(allDecls, allRefs, decl, ref)
  if (matchedDecls.length === 0 && matchedRefs.length === 0) {
    return null
  }
  const matches = params.context.includeDeclaration
    ? [...matchedDecls, ...matchedRefs]
    : matchedRefs
  return Promise.all(
    matches.map(match => toLocation(match.file, match.location.offset, match.location.length))
  )
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
