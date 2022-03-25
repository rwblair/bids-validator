import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'
import GlobalsPlugin from 'esbuild-plugin-globals'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  server: {
    watch: {
      ignored: ['!**/bids-validator/**']
    }
   },
  exclude: ['bids-validator'],
  plugins: [react()],

})
