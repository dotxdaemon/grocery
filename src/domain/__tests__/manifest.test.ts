// ABOUTME: Verifies the web app manifest references supported icon assets.
// ABOUTME: Ensures manifest icons use SVG so binary assets are not required.
import fs from 'node:fs'
import path from 'node:path'

describe('manifest icons', () => {
  it('uses svg icons', () => {
    const manifestPath = path.resolve(__dirname, '../../../public/manifest.webmanifest')
    const manifestRaw = fs.readFileSync(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestRaw)

    expect(manifest.icons).toBeDefined()
    expect(Array.isArray(manifest.icons)).toBe(true)
    expect(manifest.icons.length).toBeGreaterThan(0)

    for (const icon of manifest.icons) {
      expect(icon.src.endsWith('.svg')).toBe(true)
      expect(icon.type).toBe('image/svg+xml')
    }
  })
})
