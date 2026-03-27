// ABOUTME: Copies the OCR runtime assets into public so screenshot parsing stays offline.
// ABOUTME: Keeps generated OCR files out of git while making them available to the app shell.
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const scriptDirectory = path.dirname(scriptPath)
const projectRoot = path.resolve(scriptDirectory, '..')
const publicOcrDirectory = path.join(projectRoot, 'public', 'ocr')
const projectRequire = createRequire(import.meta.url)

const copyFile = (sourcePath, targetPath) => {
  mkdirSync(path.dirname(targetPath), { recursive: true })
  cpSync(sourcePath, targetPath)
}

const copyDirectoryFiles = (sourceDirectory, targetDirectory, fileNames) => {
  fileNames.forEach((fileName) => {
    copyFile(path.join(sourceDirectory, fileName), path.join(targetDirectory, fileName))
  })
}

const resolveProjectPath = (specifier) => {
  try {
    return projectRequire.resolve(specifier)
  } catch {
    return null
  }
}

const workerPath = resolveProjectPath('tesseract.js/dist/worker.min.js')

if (!workerPath) {
  process.exit(0)
}

const tesseractPackagePath = projectRequire.resolve('tesseract.js/package.json')
const tesseractRequire = createRequire(tesseractPackagePath)
const coreDirectory = path.dirname(tesseractRequire.resolve('tesseract.js-core/tesseract-core.wasm.js'))
const englishDataPath = projectRequire.resolve('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz')

rmSync(publicOcrDirectory, { recursive: true, force: true })

copyFile(workerPath, path.join(publicOcrDirectory, 'worker.min.js'))

copyDirectoryFiles(coreDirectory, path.join(publicOcrDirectory, 'core'), [
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

copyFile(englishDataPath, path.join(publicOcrDirectory, 'lang', 'eng.traineddata.gz'))
