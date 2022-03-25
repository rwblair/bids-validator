import path from 'path'
import * as esbuild from 'esbuild'
import GlobalsPlugin from 'esbuild-plugin-globals'

// Node.js target build
await esbuild.build({
  entryPoints: [
    path.join(process.cwd(), 'index.js'),
    path.join(process.cwd(), 'cli.js'),
    path.join(process.cwd(), 'utils', 'consoleFormat.js'),
  ],
  outdir: path.join(process.cwd(), 'dist', 'commonjs'),
  target: 'node12',
  bundle: true,
  sourcemap: true,
  platform: 'node',
})

// Browser target build
const browserConfig = {
  entryPoints: [path.join(process.cwd(), 'index.js')],
  outdir: path.join(process.cwd(), 'dist', 'esm'),
  bundle: true,
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
    external: ['pluralize'],
  },
  plugins: [
    GlobalsPlugin({
      crypto: 'globalThis',
      os: 'globalThis',
      timers: 'globalThis',
      process: 'globalThis',
    }),
  ],
}


if (process.argv[2] === 'dev') {
  browserConfig.watch = {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else console.log('watch build succeeded:', result)
    },
  }
}

await esbuild.build(browserConfig)
