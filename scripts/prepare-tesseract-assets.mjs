// ABOUTME: Copies the OCR runtime assets into public so screenshot parsing stays offline.
// ABOUTME: Keeps generated OCR files out of git while making them available to the app shell.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDirectory = path.dirname(scriptPath)
const projectRoot = path.resolve(scriptDirectory, '..')
const publicOcrDirectory = path.join(projectRoot, 'public', 'ocr')

const copyFile = (sourcePath, targetPath) => {
  mkdirSync(path.dirname(targetPath), { recursive: true })
  cpSync(sourcePath, targetPath)
}

const copyDirectoryFiles = (sourceDirectory, targetDirectory, fileNames) => {
  fileNames.forEach((fileName) => {
    copyFile(path.join(sourceDirectory, fileName), path.join(targetDirectory, fileName))
  })
}

const requirePath = (...parts) => path.join(projectRoot, 'node_modules', ...parts)

if (!existsSync(requirePath('tesseract.js', 'dist', 'worker.min.js'))) {
  process.exit(0)
}

rmSync(publicOcrDirectory, { recursive: true, force: true })

copyFile(requirePath('tesseract.js', 'dist', 'worker.min.js'), path.join(publicOcrDirectory, 'worker.min.js'))

copyDirectoryFiles(requirePath('tesseract.js-core'), path.join(publicOcrDirectory, 'core'), [
  'tesseract-core.wasm.js',
  'tesseract-core.wasm',
  'tesseract-core-relaxedsimd.wasm.js',
  'tesseract-core-relaxedsimd.wasm',
  'tesseract-core-simd.wasm.js',
  'tesseract-core-simd.wasm',
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-lstm.wasm',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm',
  'tesseract-core-relaxedsimd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm',
])

copyFile(
  requirePath('@tesseract.js-data', 'eng', '4.0.0_best_int', 'eng.traineddata.gz'),
  path.join(publicOcrDirectory, 'lang', 'eng.traineddata.gz'),
)
