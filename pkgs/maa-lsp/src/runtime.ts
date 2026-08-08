import { parse } from 'jsonc-parser'
import { type ChildProcess, spawn } from 'node:child_process'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  type ControllerRuntime,
  type Interface,
  type InterfaceConfig,
  type TaskRuntime,
  buildControllerRuntime,
  buildResourceRuntime,
  buildTaskRuntime
} from '@nekosu/maa-pipeline-manager'

type Request = {
  id: number
  method: string
  params?: Record<string, unknown>
}

type NativeObject = {
  destroy(): void
}

type RuntimeSession = {
  controller: NativeObject & Record<string, unknown>
  resource: NativeObject & Record<string, unknown>
  tasker: NativeObject & Record<string, unknown>
  tasks: TaskRuntime['tasks']
  agents: RuntimeAgent[]
}

type RuntimeAgent = {
  child: ChildProcess
  client: NativeObject & Record<string, unknown>
  identifier: string
}

let native: Record<string, any> | null = null
let session: RuntimeSession | null = null
let paused = false
let resume: (() => void) | null = null
let stopped = false
let runtimeStatus = 'idle'
let currentTask: string | null = null
let breakTasks = new Set<string>()
const history: Array<{ event: string; params: unknown }> = []

function send(message: unknown) {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function notify(event: string, params: unknown) {
  history.push({ event, params })
  if (history.length > 500) {
    history.splice(0, history.length - 500)
  }
  send({ event, params })
}

async function loadJson(file: string): Promise<Record<string, unknown>> {
  return (parse(await fs.readFile(file, 'utf8')) as Record<string, unknown>) ?? {}
}

async function waitWhilePaused() {
  if (!paused) {
    return
  }
  await new Promise<void>(resolve => {
    resume = resolve
  })
}

async function pushNotify(message: unknown) {
  notify('tasker', message)
  if (
    typeof message === 'object' &&
    message !== null &&
    'name' in message &&
    typeof message.name === 'string' &&
    'msg' in message &&
    typeof message.msg === 'string' &&
    message.msg.endsWith('.Starting') &&
    breakTasks.has(message.name)
  ) {
    paused = true
    runtimeStatus = 'paused'
    notify('breakpoint', { task: message.name, message: message.msg })
    notify('state', { status: runtimeStatus, reason: 'breakpoint', task: message.name })
  }
  await waitWhilePaused()
}

function createController(runtime: ControllerRuntime): NativeObject & Record<string, unknown> {
  if (!native) {
    throw new Error('MaaFramework is not loaded')
  }
  switch (runtime.type) {
    case 'adb':
      return new native.AdbController(...runtime.args)
    case 'win32':
      return new native.Win32Controller(...runtime.args)
    case 'playcover':
      return new native.PlayCoverController(...runtime.args)
    case 'gamepad':
      return new native.GamepadController(...runtime.args)
    default:
      throw new Error(`Unsupported controller type ${runtime.type}`)
  }
}

async function destroySession() {
  if (!session) {
    return
  }
  try {
    const operation = (session.tasker as any).post_stop?.()
    await operation?.wait?.()
  } catch {
    // Continue destroying native objects after a failed stop request.
  }
  await stopAgents()
  session.tasker.destroy()
  session.resource.destroy()
  session.controller.destroy()
  session = null
  currentTask = null
}

async function stopAgents() {
  const agents = session?.agents ?? []
  if (session) {
    session.agents = []
  }
  for (const agent of agents) {
    agent.client.destroy()
    if (agent.child.exitCode === null) {
      agent.child.kill()
    }
    notify('agent', { status: 'stopped', identifier: agent.identifier })
  }
}

async function setupAgents(
  data: Interface,
  project: string,
  resource: NativeObject & Record<string, unknown>,
  resourcePaths: string[],
  timeout: number
): Promise<RuntimeAgent[]> {
  if (!native) {
    return []
  }
  const configs = Array.isArray(data.agent) ? data.agent : data.agent ? [data.agent] : []
  const agents: RuntimeAgent[] = []
  for (const config of configs) {
    if (!config.child_exec) {
      continue
    }
    const executable = config.child_exec.replaceAll('{PROJECT_DIR}', project)
    const client = new native.Client(config.identifier) as NativeObject & Record<string, unknown>
    const identifier = String(client.identifier ?? config.identifier ?? 'maa-sublime-agent')
    const args = (config.child_args ?? [])
      .map(argument => argument.replaceAll('{PROJECT_DIR}', project))
      .concat(identifier)
    const child = spawn(executable, args, {
      cwd: project,
      env: {
        ...process.env,
        VSCODE_MAAFW_AGENT: '1',
        VSCODE_MAAFW_AGENT_ROOT: project,
        VSCODE_MAAFW_AGENT_RESOURCE: resourcePaths
          .map(relative => path.resolve(project, relative))
          .join(path.delimiter),
        PI_INTERFACE_VERSION: 'v2.5.0',
        PI_CLIENT_NAME: 'SublimeText',
        PI_CLIENT_LANGUAGE: 'en-us',
        PI_CLIENT_MAAFW_VERSION: String((native.Global as Record<string, unknown>).version ?? '')
      },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', output =>
      notify('agentOutput', { identifier, category: 'stdout', output })
    )
    child.stderr?.on('data', output =>
      notify('agentOutput', { identifier, category: 'stderr', output })
    )
    ;(client as any).timeout = String(timeout)
    ;(client as any).bind_resource(resource)
    const stopped = new Promise<boolean>(resolve => {
      child.once('exit', () => resolve(false))
      child.once('error', () => resolve(false))
    })
    const connected = await Promise.race([(client as any).connect().then(() => true), stopped])
    if (!(connected && (client as any).connected && (client as any).alive)) {
      client.destroy()
      if (child.exitCode === null) {
        child.kill()
      }
      throw new Error(`Cannot connect MaaFramework agent ${identifier}`)
    }
    ;(client as any).timeout = String(Number.MAX_SAFE_INTEGER)
    agents.push({ child, client, identifier })
    child.once('exit', code => notify('agent', { status: 'exited', identifier, code }))
    notify('agent', { status: 'connected', identifier, pid: child.pid })
  }
  return agents
}

async function setup(params: Record<string, unknown>) {
  const modulePath = params.modulePath
  const project = params.project
  if (typeof modulePath !== 'string' || typeof project !== 'string') {
    throw new Error('modulePath and project are required')
  }
  await destroySession()
  const nativeEntry = path.join(modulePath, '@maaxyz', 'maa-node', 'dist', 'index-client.js')
  await import(pathToFileURL(nativeEntry).href)
  native = (globalThis as { maa?: Record<string, any> }).maa ?? null
  if (!native) {
    throw new Error('MaaFramework native module did not expose globalThis.maa')
  }
  const global = native.Global as Record<string, unknown>
  global.debug_mode = params.debugMode !== false
  global.save_draw = params.saveDraw === true
  if (typeof params.logDir === 'string') {
    global.log_dir = params.logDir
  }

  const interfaceFile = await findInterface(project)
  const data = (await loadJson(interfaceFile)) as Interface
  const configFile = path.join(project, 'config', 'maa_pi_config.json')
  const config = (await loadJson(configFile)) as InterfaceConfig
  if (!data.resource?.some(resource => resource.name === config.resource)) {
    config.resource = data.resource?.[0]?.name
  }

  const controllerRuntime = buildControllerRuntime(data, config)
  if (typeof controllerRuntime === 'string') {
    throw new Error(controllerRuntime)
  }
  const resourceRuntime = buildResourceRuntime(data, config)
  if (typeof resourceRuntime === 'string') {
    throw new Error(resourceRuntime)
  }
  const taskRuntime = buildTaskRuntime(data, config, controllerRuntime, resourceRuntime)
  if (typeof taskRuntime === 'string') {
    throw new Error(taskRuntime)
  }

  const controller = createController(controllerRuntime)
  if (controllerRuntime.display_short_side) {
    controller.screenshot_target_short_side = controllerRuntime.display_short_side
  } else if (controllerRuntime.display_long_side) {
    controller.screenshot_target_long_side = controllerRuntime.display_long_side
  } else if (controllerRuntime.display_raw) {
    controller.screenshot_use_raw_size = true
  }
  ;(controller as any).add_sink?.((_id: unknown, message: unknown) => notify('controller', message))
  await (controller as any).post_connection().wait()
  if (!controller.connected) {
    controller.destroy()
    throw new Error(`Cannot connect controller ${controllerRuntime.name}`)
  }

  const resource = new native.Resource() as NativeObject & Record<string, unknown>
  ;(resource as any).add_sink?.((_id: unknown, message: unknown) => notify('resource', message))
  for (const relative of [
    ...resourceRuntime.paths,
    ...(controllerRuntime.attach_resource_path ?? [])
  ]) {
    await (resource as any).post_bundle(path.resolve(project, relative)).wait()
  }

  const tasker = new native.Tasker() as NativeObject & Record<string, unknown>
  ;(tasker as any).add_sink?.((_id: unknown, message: unknown) => pushNotify(message))
  ;(tasker as any).add_context_sink?.((_id: unknown, message: unknown) => pushNotify(message))
  tasker.controller = controller
  tasker.resource = resource
  let agents: RuntimeAgent[] = []
  try {
    agents = await setupAgents(
      data,
      project,
      resource,
      resourceRuntime.paths,
      typeof params.agentTimeout === 'number' ? params.agentTimeout : 30_000
    )
    for (const agent of agents) {
      ;(agent.client as any).register_controller_sink(controller)
      ;(agent.client as any).register_resource_sink(resource)
      ;(agent.client as any).register_tasker_sink(tasker)
    }
  } catch (error) {
    for (const agent of agents) {
      agent.client.destroy()
      agent.child.kill()
    }
    tasker.destroy()
    resource.destroy()
    controller.destroy()
    throw error
  }
  if (!tasker.inited) {
    for (const agent of agents) {
      agent.client.destroy()
      agent.child.kill()
    }
    tasker.destroy()
    resource.destroy()
    controller.destroy()
    throw new Error('Cannot initialize MaaFramework Tasker')
  }
  session = { controller, resource, tasker, tasks: taskRuntime.tasks, agents }
  history.length = 0
  breakTasks = new Set(
    Array.isArray(params.breakTasks)
      ? params.breakTasks.filter((task): task is string => typeof task === 'string')
      : []
  )
  paused = false
  stopped = false
  runtimeStatus = 'ready'
  return {
    controller: controllerRuntime.name,
    resource: resourceRuntime.name,
    tasks: taskRuntime.tasks.map(task => task.name),
    agents: agents.map(agent => agent.identifier),
    version: (native.Global as Record<string, unknown>).version ?? null
  }
}

async function findInterface(project: string) {
  for (const name of ['interface.json', 'interface.jsonc']) {
    const file = path.join(project, name)
    try {
      await fs.access(file)
      return file
    } catch {
      // Try the other supported interface name.
    }
  }
  throw new Error(`Cannot find interface in ${project}`)
}

async function runQueue() {
  const current = session
  if (!current) {
    return
  }
  runtimeStatus = 'running'
  notify('state', { status: runtimeStatus, queue: current.tasks.map(task => task.name) })
  try {
    for (const task of current.tasks) {
      if (stopped || current !== session) {
        break
      }
      await waitWhilePaused()
      currentTask = task.name
      notify('task', { status: 'starting', name: task.name, entry: task.entry })
      const result = await (current.tasker as any)
        .post_task(task.entry, task.pipeline_override)
        .wait()
      notify('task', {
        status: result.succeeded ? 'succeeded' : 'failed',
        name: task.name,
        entry: task.entry
      })
      if (!result.succeeded) {
        break
      }
    }
    currentTask = null
    runtimeStatus = stopped ? 'stopped' : 'finished'
    notify('state', { status: runtimeStatus })
  } catch (error) {
    currentTask = null
    runtimeStatus = 'failed'
    notify('state', { status: runtimeStatus, error: String(error) })
  }
}

function imageDataUrl(value: Uint8Array | ArrayBuffer) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value)
  return `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`
}

function recognitionDetail(id: unknown) {
  if (!session || (typeof id !== 'string' && typeof id !== 'number')) {
    return null
  }
  const detail = (session.tasker as any).recognition_detail(String(id))
  if (!detail) {
    return null
  }
  const info = { ...detail }
  delete info.raw
  delete info.draws
  return {
    info,
    raw: imageDataUrl(detail.raw),
    draws: detail.draws.map(imageDataUrl)
  }
}

async function handle(request: Request): Promise<unknown> {
  switch (request.method) {
    case 'start': {
      const result = await setup(request.params ?? {})
      void runQueue()
      return result
    }
    case 'pause':
      paused = true
      runtimeStatus = 'paused'
      notify('state', { status: runtimeStatus })
      return true
    case 'continue':
      paused = false
      resume?.()
      resume = null
      runtimeStatus = 'running'
      notify('state', { status: runtimeStatus })
      return true
    case 'stop':
      stopped = true
      paused = false
      resume?.()
      resume = null
      if (session) {
        await (session.tasker as any).post_stop().wait()
      }
      runtimeStatus = 'stopped'
      notify('state', { status: runtimeStatus })
      return true
    case 'status':
      return {
        status: runtimeStatus,
        currentTask,
        queue: session?.tasks.map(task => task.name) ?? [],
        agents:
          session?.agents.map(agent => ({
            identifier: agent.identifier,
            pid: agent.child.pid,
            running: agent.child.exitCode === null
          })) ?? [],
        history
      }
    case 'recognitionDetail':
      return recognitionDetail(request.params?.id)
    case 'actionDetail':
      return session && request.params
        ? ((session.tasker as any).action_detail(String(request.params.id)) ?? null)
        : null
    case 'nodeDetail':
      return session && typeof request.params?.task === 'string'
        ? ((session.resource as any).get_node_data(request.params.task) ?? null)
        : null
    case 'setBreakpoints':
      breakTasks = new Set(
        Array.isArray(request.params?.tasks)
          ? request.params.tasks.filter((task): task is string => typeof task === 'string')
          : []
      )
      return [...breakTasks]
    case 'stopAgents':
      await stopAgents()
      return true
    case 'shutdown':
      await destroySession()
      return true
    default:
      throw new Error(`Unknown runtime method ${request.method}`)
  }
}

let input = ''
let queue = Promise.resolve()
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  input += chunk
  while (true) {
    const newline = input.indexOf('\n')
    if (newline < 0) {
      return
    }
    const line = input.slice(0, newline).trim()
    input = input.slice(newline + 1)
    if (!line) {
      continue
    }
    queue = queue.then(async () => {
      let request: Request | null = null
      try {
        request = JSON.parse(line) as Request
        const result = await handle(request)
        send({ id: request.id, result })
        if (request.method === 'shutdown') {
          process.exit(0)
        }
      } catch (error) {
        const id = request?.id ?? null
        send({ id, error: String(error) })
      }
    })
  }
})

process.on('SIGTERM', () => {
  void destroySession().finally(() => process.exit(0))
})
