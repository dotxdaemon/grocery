// ABOUTME: Parses quick-add user input into normalized grocery item fields.
// ABOUTME: Extracts quantities, units, and canonical names without losing original text.
import type { QuantityUnit } from './types'

export interface ParsedQuickAdd {
  nameCanonical: string
  nameOriginal: string
  quantity?: number
  unit?: QuantityUnit
}

export function parseQuickAddInput(input: string): ParsedQuickAdd {
  const normalized = input.trim()

  if (!normalized) {
    return { nameCanonical: '', nameOriginal: '' }
  }

  const normalizeUnit = (raw?: string): QuantityUnit | undefined => {
    if (!raw) return undefined
    const unit = raw.toLowerCase()
    if (unit === 'lb' || unit === 'lbs') return 'lb'
    if (unit === 'oz') return 'oz'
    if (unit === 'g') return 'g'
    if (unit === 'kg') return 'kg'
    if (unit === 'ct') return 'ct'
    if (unit === 'pcs') return 'pcs'
    if (unit === 'pc') return 'pc'
    return undefined
  }

  let namePortion = normalized
  let quantity: number | undefined
  let unit: QuantityUnit | undefined

  const leadingMatch = normalized.match(
    /^(\d+(?:\.\d+)?)(?:\s*[xX])?\s*([a-zA-Z]{1,4})?\s+(.+)$/,
  )

  if (leadingMatch) {
    quantity = Number.parseFloat(leadingMatch[1])
    const unitCandidate = normalizeUnit(leadingMatch[2])
    unit = unitCandidate
    const remainder = leadingMatch[3].trim()
    namePortion = [unitCandidate ? '' : leadingMatch[2], remainder].filter(Boolean).join(' ').trim()
  } else {
    const trailingMatch = normalized.match(
      /^(.*?)(?:\s+)(?:[xX]\s*)?(\d+(?:\.\d+)?)(?:\s*([a-zA-Z]{1,4}))?$/,
    )

    if (trailingMatch) {
      const remainder = trailingMatch[1].trim()
      quantity = Number.parseFloat(trailingMatch[2])
      const unitCandidate = normalizeUnit(trailingMatch[3])
      unit = unitCandidate
      namePortion = [remainder, unitCandidate ? '' : trailingMatch[3]].filter(Boolean).join(' ').trim()
    }
  }

  const cleanedName = namePortion.replace(/\s+/g, ' ').trim()
  if (!cleanedName) {
    return { nameCanonical: '', nameOriginal: '' }
  }
  const canonical = cleanedName.toLowerCase()

  return {
    nameCanonical: canonical || normalized.toLowerCase(),
    nameOriginal: cleanedName,
    quantity,
    unit,
  }
}
