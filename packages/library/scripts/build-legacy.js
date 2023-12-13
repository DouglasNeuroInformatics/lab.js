// @ts-check

import fs from 'fs/promises'
import path from 'path'
import url from 'url'

import * as esbuild from 'esbuild'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outDir = path.resolve(__dirname, '..', 'dist', 'legacy')

const dev = process.argv.includes('--dev')

await fs.mkdir(outDir, { recursive: true })

/** @type {import('esbuild').BuildOptions} */
const options = {
  banner: {
    js: [
      '// lab.js -- Building blocks for online experiments',
      '// (c) 2015- Felix Henninger',
    ].join('\n'),
  },
  bundle: true,
  entryPoints: [path.resolve(__dirname, '..', 'src', 'index.ts')],
  format: 'iife',
  globalName: 'lab',
  minify: !dev,
  outfile: path.resolve(outDir, dev ? 'lab.dev.js' : 'lab.min.js'),
  sourcemap: dev,
}

if (dev) {
  const ctx = await esbuild.context(options)
  await ctx.watch()
  console.log('Watching...')
} else {
  await esbuild.build(options)
  console.log('Done!')
}
