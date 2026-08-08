import assert from 'node:assert/strict'
import { test } from 'node:test'

import { packageTagForVersion } from '../scripts/publish-package-tag.mjs'

test('derives an isolated Package Control tag from a semantic version', () => {
  assert.equal(packageTagForVersion('0.3.0'), 'sublime-v0.3.0')
  assert.equal(packageTagForVersion('1.0.0-beta.2'), 'sublime-v1.0.0-beta.2')
  assert.throws(() => packageTagForVersion('v1.0.0'), /invalid package version/)
})
