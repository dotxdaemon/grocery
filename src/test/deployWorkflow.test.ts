// ABOUTME: Validates the deploy workflow includes a timeout for Pages deployment.
// ABOUTME: Ensures the deploy-pages action is configured to avoid queue timeouts.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('GitHub Pages deploy workflow', () => {
  it('sets a timeout for deploy-pages', () => {
    const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/deploy.yml'), 'utf8')
    const hasTimeout = /uses:\s*actions\/deploy-pages@v4[\s\S]*?timeout:\s*['"]?\d+['"]?/m.test(workflow)

    expect(hasTimeout).toBe(true)
  })
})
