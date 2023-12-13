// @ts-check

import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import * as esbuild from 'esbuild'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BUILD_DIR = path.resolve(__dirname, '..', 'dist', 'legacy')
await fs.mkdir(BUILD_DIR, { recursive: true })

await esbuild.build({
  bundle: true,
  entryPoints: [path.resolve(__dirname, '..', 'src', 'index.ts')],
  format: 'iife',
  globalName: 'lab',
  minify: true,
  outfile: path.resolve(BUILD_DIR, 'lab.min.js'),
})

await esbuild.build({
  bundle: true,
  entryPoints: [path.resolve(__dirname, '..', 'src', 'index.ts')],
  format: 'iife',
  globalName: 'lab',
  minify: false,
  outfile: path.resolve(BUILD_DIR, 'lab.dev.js'),
  sourcemap: true,
})
