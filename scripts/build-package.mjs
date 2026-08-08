import JSZip from 'jszip'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const destination = path.join(root, 'release', 'MaaLSP.sublime-package')
const serverSource = path.join(root, 'pkgs', 'maa-lsp', 'dist', 'server.mjs')

const files = [
  ['.python-version', path.join(root, 'pkgs', 'sublime', '.python-version')],
  ['plugin.py', path.join(root, 'pkgs', 'sublime', 'plugin.py')],
  ['MaaLSP.sublime-settings', path.join(root, 'pkgs', 'sublime', 'MaaLSP.sublime-settings')],
  ['dependencies.json', path.join(root, 'pkgs', 'sublime', 'dependencies.json')],
  ['README.md', path.join(root, 'pkgs', 'sublime', 'README.md')],
  ['LICENSE', path.join(root, 'LICENSE')],
  ['THIRD_PARTY_NOTICES.md', path.join(root, 'pkgs', 'sublime', 'THIRD_PARTY_NOTICES.md')],
  ['server.mjs', serverSource]
]

const pythonVersion = (
  await readFile(path.join(root, 'pkgs', 'sublime', '.python-version'), 'utf8')
).trim()
if (pythonVersion !== '3.8') {
  throw new Error(
    `MaaLSP must use the Python 3.8 plugin host, found ${pythonVersion || 'no version'}`
  )
}

const server = await readFile(serverSource, 'utf8')
const externalImports = [...server.matchAll(/^import .*? from ["']([^"']+)["'];?$/gm)]
  .map(match => match[1])
  .filter(specifier => !specifier.startsWith('node:'))
if (externalImports.length > 0) {
  throw new Error(`server.mjs is not standalone: ${externalImports.join(', ')}`)
}

const zip = new JSZip()
for (const [name, source] of files) {
  zip.file(name, await readFile(source))
}
const archive = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
  platform: 'UNIX'
})

await mkdir(path.dirname(destination), { recursive: true })
await writeFile(destination, archive)

const check = await JSZip.loadAsync(archive)
for (const [name] of files) {
  if (!check.file(name)) {
    throw new Error(`Package is missing ${name}`)
  }
}
console.log(`Created ${path.relative(root, destination)} (${archive.length} bytes)`)
