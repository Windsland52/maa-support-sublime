import { createJiti } from 'jiti/static'
import { access } from 'node:fs/promises'
import * as path from 'node:path'

import type { DiagnosticType, ParserConfig } from '@nekosu/maa-pipeline-manager'

export const MAATOOLS_CONFIG_FILE = 'maatools.config.mts'

export type MaaToolsConfig = {
  parser?: ParserConfig
  check?: {
    override?: Partial<Record<DiagnosticType, 'ignore' | 'warning' | 'error'>>
  }
  [key: string]: unknown
}

export type MaaToolsConfigResult = {
  config: MaaToolsConfig | null
  error: unknown | null
  file: string
}

export async function loadMaaToolsConfig(workspaceRoot: string): Promise<MaaToolsConfigResult> {
  const file = path.join(workspaceRoot, MAATOOLS_CONFIG_FILE)
  try {
    await access(file)
  } catch {
    return { config: null, error: null, file }
  }

  try {
    const jiti = createJiti(import.meta.url, { moduleCache: false })
    const config = (await jiti.import(file, { default: true })) as MaaToolsConfig
    return { config, error: null, file }
  } catch (error) {
    return { config: null, error, file }
  }
}
