import JSZip from 'jszip'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import * as path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const archive = path.join(root, 'release', 'LSP-MaaFramework.sublime-package')
const requiredEntries = [
  '.python-version',
  'LICENSE',
  'README.md',
  'dependencies.json',
  'plugin.py',
  'runtime.mjs',
  'server.mjs'
]

function runGit(cwd, args, options = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit'
  })?.trim()
}

function remoteHasTag(remote, tag) {
  const result = spawnSync(
    'git',
    ['ls-remote', '--exit-code', '--tags', remote, `refs/tags/${tag}`],
    { cwd: root, stdio: 'ignore' }
  )
  if (result.status === 0) {
    return true
  }
  if (result.status === 2) {
    return false
  }
  throw new Error(`cannot query ${tag} from ${remote} (git exited ${result.status ?? 'unknown'})`)
}

function safeEntryName(name) {
  const normalized = name.replaceAll('\\', '/')
  if (
    path.posix.isAbsolute(normalized) ||
    path.win32.isAbsolute(normalized) ||
    normalized.split('/').some(part => part === '..')
  ) {
    throw new Error(`unsafe package entry: ${name}`)
  }
  return normalized
}

export function packageTagForVersion(version) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`invalid package version: ${version}`)
  }
  return `sublime-v${version}`
}

export function validatePublishRef(version, releaseRef, pushRemote) {
  if (pushRemote && releaseRef && releaseRef !== `v${version}`) {
    throw new Error(`release ref ${releaseRef} does not match package version ${version}`)
  }
}

export async function publishPackageTag({ pushRemote = null } = {}) {
  const packageJson = JSON.parse(
    await readFile(path.join(root, 'pkgs', 'maa-lsp', 'package.json'), 'utf8')
  )
  const tag = packageTagForVersion(packageJson.version)
  validatePublishRef(packageJson.version, process.env.GITHUB_REF_NAME, pushRemote)
  if (pushRemote && remoteHasTag(pushRemote, tag)) {
    console.log(`${tag} already exists on ${pushRemote}; leaving the immutable tag unchanged`)
    return { tag, skipped: true }
  }

  const zip = await JSZip.loadAsync(await readFile(archive))
  for (const entry of requiredEntries) {
    if (!zip.file(entry)) {
      throw new Error(`package tag is missing required entry ${entry}`)
    }
  }

  const temp = await mkdtemp(path.join(tmpdir(), 'lsp-maaframework-package-tag-'))
  try {
    for (const item of Object.values(zip.files)) {
      const name = safeEntryName(item.name)
      if (!name || item.dir) {
        continue
      }
      const destination = path.join(temp, ...name.split('/'))
      await mkdir(path.dirname(destination), { recursive: true })
      await writeFile(destination, await item.async('nodebuffer'))
    }

    runGit(temp, ['init', '--quiet'])
    runGit(temp, ['config', 'user.name', 'github-actions[bot]'])
    runGit(temp, ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'])
    runGit(temp, ['config', 'core.autocrlf', 'false'])
    runGit(temp, ['add', '--all'])
    runGit(temp, ['commit', '--quiet', '-m', `LSP-MaaFramework ${packageJson.version} package`])
    runGit(temp, ['tag', tag])
    const commit = runGit(temp, ['rev-parse', 'HEAD'], { capture: true })

    if (pushRemote) {
      runGit(temp, ['push', pushRemote, `refs/tags/${tag}`])
      console.log(`Published package-only tag ${tag} at ${commit}`)
    } else {
      console.log(`Verified package-only tag ${tag} at ${commit}`)
    }
    return { commit, skipped: false, tag }
  } finally {
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length > 2 || (args.length > 0 && args[0] !== '--push')) {
    throw new Error('usage: node scripts/publish-package-tag.mjs [--push <git-remote-url>]')
  }
  const pushRemote = args[0] === '--push' ? args[1] : null
  if (args[0] === '--push' && !pushRemote) {
    throw new Error('--push requires a git remote URL')
  }
  await publishPackageTag({ pushRemote })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
