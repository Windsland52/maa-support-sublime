import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import * as path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const runtime = fileURLToPath(new URL('../dist/runtime.mjs', import.meta.url))

class RuntimeClient {
  constructor(cwd) {
    this.child = spawn(process.execPath, [runtime], { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
    this.nextId = 1
    this.messages = []
    this.waiters = []
    this.buffer = ''
    this.stderr = ''
    this.child.stdout.setEncoding('utf8')
    this.child.stdout.on('data', chunk => this.consume(chunk))
    this.child.stderr.on('data', chunk => {
      this.stderr += chunk.toString()
    })
  }

  consume(chunk) {
    this.buffer += chunk
    while (true) {
      const newline = this.buffer.indexOf('\n')
      if (newline < 0) return
      const line = this.buffer.slice(0, newline)
      this.buffer = this.buffer.slice(newline + 1)
      if (line) this.dispatch(JSON.parse(line))
    }
  }

  dispatch(message) {
    const index = this.waiters.findIndex(waiter => waiter.predicate(message))
    if (index >= 0) {
      const [waiter] = this.waiters.splice(index, 1)
      clearTimeout(waiter.timer)
      waiter.resolve(message)
    } else {
      this.messages.push(message)
    }
  }

  waitFor(predicate, timeout = 5000) {
    const index = this.messages.findIndex(predicate)
    if (index >= 0) return Promise.resolve(this.messages.splice(index, 1)[0])
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        timer: setTimeout(() => reject(new Error(`runtime timeout: ${this.stderr}`)), timeout)
      }
      this.waiters.push(waiter)
    })
  }

  request(method, params = {}) {
    const id = this.nextId++
    this.child.stdin.write(`${JSON.stringify({ id, method, params })}\n`)
    return this.waitFor(message => message.id === id)
  }

  async shutdown() {
    const response = await this.request('shutdown')
    if (this.child.exitCode === null) {
      await new Promise(resolve => this.child.once('exit', resolve))
    }
    return response
  }

  kill() {
    this.child.kill()
  }
}

test('native worker starts and controls a MaaFramework task queue', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'maa-runtime-'))
  let client
  try {
    const project = path.join(temp, 'project')
    const modulePath = path.join(temp, 'native', 'node_modules')
    const nativePackage = path.join(modulePath, '@maaxyz', 'maa-node')
    const pipeline = path.join(project, 'resource', 'pipeline')
    await mkdir(path.join(nativePackage, 'dist'), { recursive: true })
    await mkdir(path.join(project, 'config'), { recursive: true })
    await mkdir(pipeline, { recursive: true })
    await writeFile(path.join(nativePackage, 'package.json'), '{"type":"module"}')
    await writeFile(
      path.join(nativePackage, 'dist', 'index-client.js'),
      `
      class Operation {
        constructor(succeeded = true, before = null, value = null) {
          this.succeeded = succeeded
          this.before = before
          this.value = value
        }
        wait() {
          const pending = (async () => {
            await this.before
            await new Promise(resolve => setTimeout(resolve, 10))
            return this
          })()
          pending.get = () => this.value
          return pending
        }
      }
      class Controller {
        constructor() { this.connected = true }
        add_sink(sink) { this.sink = sink }
        post_connection() { return new Operation() }
        post_screencap() {
          return new Operation(
            true,
            null,
            Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR4AWP8DwQMQMDEAAUAPfgEADYYS7QAAAAASUVORK5CYII=', 'base64')
          )
        }
        destroy() {}
      }
      class Resource {
        add_sink(sink) { this.sink = sink }
        post_bundle() { return new Operation() }
        destroy() {}
      }
      class Tasker {
        constructor() { this.inited = true }
        add_sink(sink) { this.sink = sink }
        add_context_sink(sink) { this.contextSink = sink }
        post_task(entry) {
          const gate = this.sink?.(0, { msg: 'RecognitionNode.Starting', name: entry, reco_id: 7 })
          return new Operation(true, gate)
        }
        recognition_detail(id) {
          return { id, name: 'Entry', raw: new Uint8Array([1, 2]), draws: [new Uint8Array([3])] }
        }
        action_detail(id) { return { id, name: 'Click' } }
        post_stop() { return new Operation() }
        destroy() {}
      }
      class Client {
        constructor(identifier) {
          this.identifier = identifier || 'fake-agent'
          this.connected = true
          this.alive = true
        }
        bind_resource() {}
        async connect() {}
        register_controller_sink() {}
        register_resource_sink() {}
        register_tasker_sink() {}
        destroy() { this.alive = false }
      }
      globalThis.maa = {
        Global: { version: '5.12.2' },
        AdbController: Controller,
        Win32Controller: Controller,
        PlayCoverController: Controller,
        GamepadController: Controller,
        Resource,
        Tasker,
        Client,
        Win32ScreencapMethod: { FramePool: 'FramePool' },
        Win32InputMethod: { SendMessageWithCursorPos: 'Cursor', SendMessage: 'Message' },
        GamepadType: { Xbox360: 'Xbox360' }
      }
      `
    )
    await writeFile(
      path.join(project, 'interface.json'),
      JSON.stringify({
        controller: [{ name: 'ADB', type: 'Adb' }],
        resource: [{ name: 'Default', path: 'resource' }],
        task: [
          { name: 'First', entry: 'Entry' },
          { name: 'Second', entry: 'Done' }
        ],
        agent: {
          child_exec: process.execPath,
          child_args: ['-e', 'setInterval(() => {}, 1000)'],
          identifier: 'fake-agent'
        }
      })
    )
    await writeFile(
      path.join(project, 'config', 'maa_pi_config.json'),
      JSON.stringify({
        controller: 'ADB',
        resource: 'Default',
        adb: { adb_path: 'adb', address: '127.0.0.1:5555', screencap: '1', input: '1' },
        task: [{ name: 'First' }, { name: 'Second' }]
      })
    )
    await writeFile(path.join(pipeline, 'main.json'), '{"Entry":{},"Done":{}}')

    client = new RuntimeClient(temp)
    const started = await client.request('start', {
      modulePath,
      project,
      logDir: path.join(project, 'debug'),
      debugMode: true,
      saveDraw: false,
      breakTasks: ['Done']
    })
    assert.equal(started.error, undefined)
    assert.deepEqual(started.result.tasks, ['First', 'Second'])
    assert.deepEqual(started.result.agents, ['fake-agent'])
    assert.equal(started.result.version, '5.12.2')

    const breakpoint = await client.waitFor(message => message.event === 'breakpoint')
    assert.equal(breakpoint.params.task, 'Done')
    const paused = await client.request('status')
    assert.equal(paused.result.status, 'paused')
    assert.equal((await client.request('continue')).result, true)
    const finished = await client.waitFor(
      message => message.event === 'state' && message.params.status === 'finished'
    )
    assert.equal(finished.params.status, 'finished')
    const status = await client.request('status')
    assert.equal(status.result.status, 'finished')
    assert.deepEqual(status.result.queue, ['First', 'Second'])
    assert.equal(status.result.agents[0].identifier, 'fake-agent')
    assert.equal(status.result.agents[0].running, true)
    assert.ok(status.result.history.some(item => item.event === 'tasker'))
    const detail = await client.request('recognitionDetail', { id: 7 })
    assert.equal(detail.result.info.name, 'Entry')
    assert.equal(detail.result.raw, 'data:image/png;base64,AQI=')
    assert.deepEqual(detail.result.draws, ['data:image/png;base64,Aw=='])
    const screenshot = await client.request('screenshot')
    assert.match(screenshot.result, /^data:image\/png;base64,/)
    const crop = await client.request('cropScreenshot', { rect: [0, 0, 1, 1] })
    assert.match(crop.result, /^data:image\/png;base64,/)
    assert.deepEqual((await client.request('setBreakpoints', { tasks: ['Entry'] })).result, [
      'Entry'
    ])
    assert.equal((await client.request('stopAgents')).result, true)
    assert.deepEqual((await client.request('status')).result.agents, [])
    assert.equal((await client.request('stop')).result, true)
    assert.equal((await client.shutdown()).result, true)
    client = undefined
  } finally {
    client?.kill()
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
})
