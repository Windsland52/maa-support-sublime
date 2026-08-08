import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

async function readJson(relative) {
  return JSON.parse(await readFile(new URL(relative, import.meta.url)))
}

test('Sublime package exposes a settings command and settings schema', async () => {
  const commands = await readJson('../pkgs/sublime/Default.sublime-commands')
  const metadata = await readJson('../pkgs/sublime/sublime-package.json')

  assert.ok(
    commands.some(
      command =>
        command.caption === 'Preferences: LSP-MaaFramework Settings' &&
        command.command === 'edit_settings' &&
        command.args?.base_file.endsWith('/LSP-MaaFramework.sublime-settings')
    )
  )

  const [packageSettings, projectSettings] = metadata.contributions.settings
  assert.deepEqual(packageSettings.file_patterns, ['/LSP-MaaFramework.sublime-settings'])
  assert.equal(packageSettings.schema.$id, 'sublime://settings/LSP-MaaFramework')
  assert.equal(
    projectSettings.schema.properties.settings.properties.LSP.properties['LSP-MaaFramework'].$ref,
    'sublime://settings/LSP-MaaFramework#/definitions/PluginConfig'
  )
})

test('Sublime package leaves optional runtime key bindings disabled', async () => {
  const source = await readFile(
    new URL('../pkgs/sublime/Default.sublime-keymap', import.meta.url),
    'utf8'
  )
  const activeBindings = JSON.parse(source.replace(/^\s*\/\/.*$/gm, ''))

  assert.deepEqual(activeBindings, [])
  for (const command of [
    'maa_framework_shortcut_start',
    'maa_framework_shortcut_toggle_pause',
    'maa_framework_shortcut_stop',
    'maa_framework_shortcut_screenshot'
  ]) {
    assert.match(source, new RegExp(`"command": "${command}"`))
  }
})
