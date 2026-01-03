// ABOUTME: Formats timestamps into friendly relative strings for the UI.
// ABOUTME: Keeps date presentation consistent across list and item views.
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['week', 1000 * 60 * 60 * 24 * 7],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
  ['second', 1000],
]

export function formatRelativeTime(timestamp: number) {
  const diff = timestamp - Date.now()
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, ms] of units) {
    if (Math.abs(diff) > ms || unit === 'second') {
      return formatter.format(Math.round(diff / ms), unit)
    }
  }
  return 'just now'
}
