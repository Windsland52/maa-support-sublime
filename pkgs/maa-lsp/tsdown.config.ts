import { defineConfig } from 'tsdown'

const shared = {
  format: 'esm' as const,
  alias: {
    'jsonc-parser': 'jsonc-parser/lib/esm/main.js'
  },
  outDir: 'dist',
  outputOptions: {
    codeSplitting: false
  },
  deps: {
    alwaysBundle: (id: string) => !id.startsWith('node:'),
    onlyAllowBundle: false
  }
}

export default defineConfig([
  {
    ...shared,
    entry: ['src/server.ts'],
    clean: true
  },
  {
    ...shared,
    entry: ['src/runtime.ts'],
    clean: false
  }
])
