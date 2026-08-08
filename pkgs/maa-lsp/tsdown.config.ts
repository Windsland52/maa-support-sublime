import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/server.ts'],
  format: 'esm',
  alias: {
    'jsonc-parser': 'jsonc-parser/lib/esm/main.js'
  },
  outDir: 'dist',
  clean: true,
  deps: {
    alwaysBundle: id => !id.startsWith('node:'),
    onlyAllowBundle: false
  }
})
