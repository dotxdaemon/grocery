// ABOUTME: Renders an inline toast for destructive actions with undo support.
// ABOUTME: Surfaces undo and dismiss controls when eligible history is present.
import { useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { useAppStore } from '../state/appStore'

const destructiveLabels = new Set(['Deleted item', 'Cleared purchased', 'Deleted list'])

export function UndoToast() {
  const lastUndo = useAppStore((state) => state.lastUndo)
  const undo = useAppStore((state) => state.undo)
  const clearUndo = useAppStore((state) => state.clearUndo)
  const [busy, setBusy] = useState(false)

  if (!lastUndo || !destructiveLabels.has(lastUndo.label)) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <Card className="pointer-events-auto flex w-full max-w-xl items-center gap-3 border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
        <span className="text-sm font-medium text-foreground">{lastUndo.label}</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await undo()
              } finally {
                setBusy(false)
              }
            }}
          >
            Undo
          </Button>
          <Button size="sm" variant="ghost" onClick={() => clearUndo()} disabled={busy}>
            Dismiss
          </Button>
        </div>
      </Card>
    </div>
  )
}
