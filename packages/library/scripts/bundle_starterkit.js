import fs from 'fs'
import JSZip from 'jszip'
import shell from 'shelljs'

// Copy files ------------------------------------------------------------------
shell.mkdir('-p', 'dist/labjs-starterkit/lib')
shell.cp('-R', 'src/starterkit/index.html', 'dist/labjs-starterkit')
shell.cp('-R', 'src/starterkit/study.js', 'dist/labjs-starterkit')
shell.cp('-R', 'dist/umd/lab.dev.js', 'dist/labjs-starterkit/lib')
shell.cp('-R', 'dist/umd/lab.js', 'dist/labjs-starterkit/lib')
shell.cp('-R', 'dist/umd/lab.js.map', 'dist/labjs-starterkit/lib')
shell.cp('-R', 'dist/css/lab.css', 'dist/labjs-starterkit/lib')
shell.cp('-R', 'src/starterkit/lib/loading.svg', 'dist/labjs-starterkit/lib')

// Create the starterkit bundle ------------------------------------------------
// (TODO: Think about doing this directly from the source files)
const zip = new JSZip()

shell
  .ls('-R', 'dist/labjs-starterkit/**/*')
  .filter(filename => filename.startsWith('dist/labjs-starterkit'))
  .forEach(filename => {
    zip.file(
      filename.replace(/^dist\/labjs-starterkit\//, ''),
      fs.readFileSync(filename),
    )
  })

// Compress and output bundle file
zip
  .generateNodeStream({
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    type: 'nodebuffer',
    streamFiles: true,
  })
  .pipe(fs.createWriteStream('dist/labjs-starterkit.zip'))
  .on('finish', () => console.log('Created starterkit bundle'))
