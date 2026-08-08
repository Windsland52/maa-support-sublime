import assert from 'node:assert/strict'
import { test } from 'node:test'

import { packageTagForVersion, validatePublishRef } from '../scripts/publish-package-tag.mjs'

test('derives an isolated Package Control tag from a semantic version', () => {
  assert.equal(packageTagForVersion('0.3.0'), 'sublime-v0.3.0')
  assert.equal(packageTagForVersion('1.0.0-beta.2'), 'sublime-v1.0.0-beta.2')
  assert.throws(() => packageTagForVersion('v1.0.0'), /invalid package version/)
})

test('only requires a version-matching ref when publishing a tag', () => {
  assert.doesNotThrow(() => validatePublishRef('0.3.1', 'main', null))
  assert.doesNotThrow(() => validatePublishRef('0.3.1', 'v0.3.1', 'origin'))
  assert.throws(
    () => validatePublishRef('0.3.1', 'main', 'origin'),
    /release ref main does not match package version 0\.3\.1/
  )
})
