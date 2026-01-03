// ABOUTME: Provides controls for categories, saved items, and data backup/import.
// ABOUTME: Surfaces storage status, favorites, and export/import utilities.
import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAppStore } from '../state/appStore'
import { DEFAULT_CATEGORY_ORDER } from '../domain/categories'
import { formatRelativeTime } from '../lib/time'

export function SettingsPage() {
  const {
    storageMode,
    categories,
    lists,
    preferences,
    itemHistory,
    renameCategory,
    reorderCategories,
    resetCategories,
    toggleFavoriteHistory,
    addItemQuick,
    exportData,
    importData,
  } = useAppStore((state) => ({
    storageMode: state.storageMode,
    categories: state.categories,
    lists: state.lists,
    preferences: state.preferences,
    itemHistory: state.itemHistory,
    renameCategory: state.renameCategory,
    reorderCategories: state.reorderCategories,
    resetCategories: state.resetCategories,
    toggleFavoriteHistory: state.toggleFavoriteHistory,
    addItemQuick: state.addItemQuick,
    exportData: state.exportData,
    importData: state.importData,
  }))

  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({})
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [importErrors, setImportErrors] = useState<string[] | undefined>(undefined)

  const activeListId = preferences.activeListId ?? lists[0]?.id
  const activeOrder = lists.find((list) => list.id === activeListId)?.categoryOrder ?? DEFAULT_CATEGORY_ORDER

  const moveCategory = async (id: string, delta: number) => {
    if (!activeListId) return
    const order = [...activeOrder]
    const index = order.indexOf(id)
    if (index < 0) return
    const target = index + delta
    if (target < 0 || target >= order.length) return
    const next = [...order]
    const [removed] = next.splice(index, 1)
    next.splice(target, 0, removed)
    await reorderCategories(activeListId, next)
  }

  const handleExport = async () => {
    const payload = await exportData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'grocery-export.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const parsed = JSON.parse(text)
      const result = await importData(parsed)
      setImportErrors(result.errors)
      setImportMessage(result.valid ? 'Import complete' : 'Import failed. See errors.')
    } catch {
      setImportMessage('Unable to parse JSON file.')
      setImportErrors(['Invalid JSON'])
    }
  }

  const sortedHistory = useMemo(() => {
    return [...itemHistory].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      if (a.timesUsed !== b.timesUsed) return b.timesUsed - a.timesUsed
      return (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)
    })
  }, [itemHistory])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage categories, saved items, and backups.</p>
        <p className="text-xs text-muted-foreground">Storage mode: {storageMode === 'idb' ? 'IndexedDB' : 'Fallback (localStorage)'}</p>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Categories</h2>
            <p className="text-sm text-muted-foreground">Rename or reorder the categories used for grouping.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (window.confirm('Reset categories to defaults for all lists?')) resetCategories()
            }}
          >
            Reset to defaults
          </Button>
        </div>
        <div className="space-y-2">
          {activeOrder.map((categoryId) => {
            const category = categories.find((entry) => entry.id === categoryId)
            if (!category) return null
            const value = renameDrafts[category.id] ?? category.name
            return (
              <div key={category.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2">
                <div className="flex flex-1 items-center gap-2">
                  <Label className="w-24 text-xs uppercase text-muted-foreground">{category.id}</Label>
                  <Input
                    value={value}
                    onChange={(event) => setRenameDrafts((prev) => ({ ...prev, [category.id]: event.target.value }))}
                    className="max-w-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => moveCategory(category.id, -1)} aria-label="Move category up">
                    ↑
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => moveCategory(category.id, 1)} aria-label="Move category down">
                    ↓
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => renameCategory(category.id, value)}
                    disabled={!value.trim() || value === category.name}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Saved items</h2>
            <p className="text-sm text-muted-foreground">Favorites appear first when you use quick add.</p>
          </div>
        </div>
        <div className="space-y-2">
          {sortedHistory.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{entry.nameCanonical}</span>
                  {entry.isFavorite && <Badge>Favorite</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">Last used {formatRelativeTime(entry.lastUsedAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleFavoriteHistory(entry.id)}>
                  {entry.isFavorite ? 'Unstar' : 'Star'}
                </Button>
                {activeListId && (
                  <Button
                    size="sm"
                    onClick={() => addItemQuick(activeListId, entry.nameCanonical, entry.defaultCategoryId)}
                  >
                    Add to active list
                  </Button>
                )}
              </div>
            </div>
          ))}
          {sortedHistory.length === 0 && <p className="text-sm text-muted-foreground">No history yet. Add items to build suggestions.</p>}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Backup and restore</h2>
            <p className="text-sm text-muted-foreground">Export your data to JSON or import a backup file.</p>
          </div>
          <Button onClick={handleExport}>Export JSON</Button>
        </div>
        <div className="space-y-2 text-sm">
          <Label htmlFor="import-file" className="text-sm font-medium">
            Import JSON
          </Label>
          <Input id="import-file" type="file" accept="application/json" onChange={handleImport} />
          {importMessage && <p className="text-sm text-muted-foreground">{importMessage}</p>}
          {importErrors && importErrors.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
              {importErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  )
}
