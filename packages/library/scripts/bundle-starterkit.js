// @ts-check

import fs from 'fs'
import path from 'path'
import url from 'url'

import JSZip from 'jszip'
import shell from 'shelljs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIST_DIR = path.resolve(__dirname, '..', 'dist')
const LEGACY_DIR = path.resolve(DIST_DIR, 'legacy')
const OUT_DIR = path.resolve(DIST_DIR, 'labjs-starterkit')
const SRC_DIR = path.resolve(__dirname, '..', 'src')

await shell.mkdir(OUT_DIR)

// Copy files ------------------------------------------------------------------
shell.mkdir('-p', path.resolve(OUT_DIR, 'lib'))
shell.cp('-R', path.resolve(SRC_DIR, 'starterkit/index.html'), OUT_DIR)
shell.cp('-R', path.resolve(SRC_DIR, 'starterkit/study.js'), OUT_DIR)
shell.cp('-R', path.resolve(LEGACY_DIR, "**/*"), path.resolve(OUT_DIR, 'lib'))
shell.cp('-R', path.resolve(DIST_DIR, 'css/lab.css'), path.resolve(OUT_DIR, 'lib'))
shell.cp('-R', path.resolve(SRC_DIR, 'starterkit/lib/loading.svg'), path.resolve(OUT_DIR, 'lib'))

// Create the starterkit bundle ------------------------------------------------
// (TODO: Think about doing this directly from the source files)
const zip = new JSZip()

shell
  .ls('-R', path.join(OUT_DIR, '/**/*'))
  .filter(filename => filename.startsWith('dist/labjs-starterkit'))
  .forEach(filename => {
    zip.file(filename.replace(/^dist\/labjs-starterkit\//, ''), fs.readFileSync(filename))
  })

// Compress and output bundle file
zip
  .generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    type: 'nodebuffer',
    streamFiles: true,
  })
  .pipe(fs.createWriteStream(path.resolve(DIST_DIR, 'labjs-starterkit.zip')))
  .on('finish', () => console.log('Created starterkit bundle'))
