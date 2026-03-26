// ABOUTME: Converts screenshot files into grocery item lines for direct list import.
// ABOUTME: Keeps OCR and text cleanup logic in one place for the list page.
type ScreenshotWorker = Awaited<ReturnType<(typeof import('tesseract.js'))['createWorker']>>

const ignoredLines = new Set(['groceries', 'grocery list', 'ingredients', 'shopping list', 'to buy'])
const ocrAssetBasePath = `${import.meta.env.BASE_URL}ocr`
let screenshotWorkerPromise: Promise<ScreenshotWorker> | undefined

const normalizeLine = (line: string) => {
  let value = line
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!value) return ''

  value = value
    .replace(/^(?:\[[ xX]\]|\([ xX]\)|[☐☑☒✓•●▪◦‣∙*\-–—+])\s*/u, '')
    .replace(/^(?:\d+|[a-zA-Z])[).\]:-]\s+/, '')
    .trim()

  return value
}

const getScreenshotWorker = async () => {
  screenshotWorkerPromise ??= (async () => {
    const { createWorker } = await import('tesseract.js')

    return createWorker('eng', 1, {
      workerPath: `${ocrAssetBasePath}/worker.min.js`,
      corePath: `${ocrAssetBasePath}/core`,
      langPath: `${ocrAssetBasePath}/lang`,
      logger: () => {},
    })
  })()

  return screenshotWorkerPromise
}

const loadImage = async (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read screenshot.'))
    }

    image.src = objectUrl
  })

const renderScreenshotForOcr = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas')
  const scale = image.naturalWidth < 1400 ? 2 : 1
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not prepare screenshot.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas
}

export const extractItemsFromScreenshotText = (text: string) => {
  const seen = new Set<string>()
  const items: string[] = []

  text.split(/\r?\n+/).forEach((line) => {
    const normalized = normalizeLine(line)
    if (!normalized) return
    if (!/[a-z0-9]/i.test(normalized)) return
    if (ignoredLines.has(normalized.toLowerCase())) return

    const canonical = normalized.toLowerCase()
    if (seen.has(canonical)) return

    seen.add(canonical)
    items.push(normalized)
  })

  return items
}

export const collectItemsFromScreenshot = async (file: File) => {
  const image = await loadImage(file)
  const canvas = renderScreenshotForOcr(image)
  const worker = await getScreenshotWorker()
  const result = await worker.recognize(canvas)
  const items = extractItemsFromScreenshotText(result.data.text)

  if (!items.length) {
    throw new Error('No grocery items found in screenshot.')
  }

  return items
}
