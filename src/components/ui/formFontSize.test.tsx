// ABOUTME: Ensures form controls render with font sizes that avoid iOS zoom triggers.
// ABOUTME: Verifies inputs, textareas, and selects keep text at a 16px baseline or larger.
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

describe('Form control font sizing', () => {
  it('keeps text inputs at least base size', () => {
    render(<Input placeholder="plain input" />)
    const input = screen.getByPlaceholderText('plain input')
    expect(input.className).toContain('text-base')
    expect(input.className).not.toContain('text-sm')
  })

  it('keeps textareas at least base size', () => {
    render(<Textarea placeholder="notes field" />)
    const textarea = screen.getByPlaceholderText('notes field')
    expect(textarea.className).toContain('text-base')
    expect(textarea.className).not.toContain('text-sm')
  })

  it('keeps select triggers at least base size', () => {
    render(
      <Select defaultValue="one">
        <SelectTrigger data-testid="select-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
        </SelectContent>
      </Select>,
    )
    const trigger = screen.getByTestId('select-trigger')
    expect(trigger.className).toContain('text-base')
    expect(trigger.className).not.toContain('text-sm')
  })
})
