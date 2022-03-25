import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'
import GlobalsPlugin from 'esbuild-plugin-globals'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: true,
      format: 'esm',
      define: {
        global: 'globalThis',
        window: 'globalThis',
        crypto: 'globalThis',
        os: 'globalThis',
        timers: 'globalThis',
        process: JSON.stringify({
          env: {},
          argv: [],
          stdout: '',
          stderr: '',
          stdin: '',
          version: 'v12.14.1',
        }),
      },
      plugins: [
        GlobalsPlugin({
          crypto: 'globalThis',
          os: 'globalThis',
          timers: 'globalThis',
          process: 'globalThis',
        }),
      ]
    },
    include: ['bids-validator'],
  },
  resolve: {
    alias: [
      // Workaround for bids-validator -> hed-validator -> xml2js -> sax -> Stream shim
      { find: 'stream', replacement: 'stream-browserify' },
      // sax -> Buffer shim
      { find: 'buffer', replacement: 'buffer/' }
    ]
  },
  plugins: [
    react(),
  ],

})
