import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('custom Package Control repository stays compatible with schema 3 clients', async () => {
  const repository = JSON.parse(await readFile(new URL('../repository.json', import.meta.url)))
  assert.equal(repository.schema_version, '3.0.0')
  assert.equal(repository.packages.length, 1)

  const [release] = repository.packages[0].releases
  assert.equal(repository.packages[0].name, 'LSP-MaaFramework')
  assert.equal(release.tags, 'sublime-v')
  assert.equal(release.sublime_text, '>=4000')
  assert.deepEqual(Object.keys(release).sort(), ['sublime_text', 'tags'])
})
