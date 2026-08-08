import { type Dirent } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

export type ResourceRoot = {
  workspaceRoot: string
  dir: string
  interfaceFile: string
  configFile: string
}

const ignoredDirectoryNames = new Set(['node_modules', 'MaaUtils', 'MaaDeps'])
const interfaceFileNames = new Set(['interface.json', 'interface.jsonc'])

function shouldIgnoreDirectory(name: string): boolean {
  return name.startsWith('.') || ignoredDirectoryNames.has(name)
}

async function locateResourceRootsInWorkspace(
  workspaceRoot: string,
  onError: (dir: string, error: unknown) => void
): Promise<ResourceRoot[]> {
  const result: ResourceRoot[] = []

  const travel = async (current: string): Promise<void> => {
    let children: Dirent[]
    try {
      children = await fs.readdir(current, { withFileTypes: true })
    } catch (error) {
      onError(current, error)
      return
    }

    for (const child of children) {
      if (child.isDirectory() && shouldIgnoreDirectory(child.name)) {
        continue
      }
      if (child.isFile() && interfaceFileNames.has(child.name)) {
        result.push({
          workspaceRoot,
          dir: current,
          interfaceFile: child.name,
          configFile: path.join(current, 'config', 'maa_pi_config.json')
        })
      }
      if (child.isDirectory()) {
        await travel(path.join(current, child.name))
      }
    }
  }

  await travel(workspaceRoot)
  return result
}

export async function locateResourceRoots(
  workspaceRoots: string[],
  onError: (dir: string, error: unknown) => void = () => undefined
): Promise<ResourceRoot[]> {
  const roots = await Promise.all(
    workspaceRoots.map(workspaceRoot => locateResourceRootsInWorkspace(workspaceRoot, onError))
  )
  return roots.flat()
}

export function isInterfaceFile(file: string): boolean {
  return interfaceFileNames.has(path.basename(file))
}

export function isIgnoredDirectory(file: string): boolean {
  return shouldIgnoreDirectory(path.basename(file))
}
