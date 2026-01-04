// ABOUTME: Renders the overview of grocery lists with create, rename, reorder, and delete actions.
// ABOUTME: Serves as the landing page for managing multiple shopping lists.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { useAppStore } from '../state/appStore'
import { formatRelativeTime } from '../lib/time'

export function ListsPage() {
  const lists = useAppStore((state) => state.lists)
  const items = useAppStore((state) => state.items)
  const createList = useAppStore((state) => state.createList)
  const renameList = useAppStore((state) => state.renameList)
  const reorderLists = useAppStore((state) => state.reorderLists)
  const deleteList = useAppStore((state) => state.deleteList)
  const setActiveList = useAppStore((state) => state.setActiveList)
  const [newListName, setNewListName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const counts = useMemo(() => {
    const map: Record<string, { total: number; purchased: number }> = {}
    for (const item of items) {
      if (!map[item.listId]) {
        map[item.listId] = { total: 0, purchased: 0 }
      }
      map[item.listId].total += 1
      if (item.isPurchased) map[item.listId].purchased += 1
    }
    return map
  }, [items])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newListName.trim()) return
    await createList(newListName)
    setNewListName('')
  }

  const moveList = async (id: string, delta: number) => {
    const index = lists.findIndex((list) => list.id === id)
    if (index < 0) return
    const target = index + delta
    if (target < 0 || target >= lists.length) return
    const order = [...lists]
    const [removed] = order.splice(index, 1)
    order.splice(target, 0, removed)
    await reorderLists(order.map((list) => list.id))
  }

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return setRenamingId(null)
    await renameList(id, renameValue)
    setRenamingId(null)
    setRenameValue('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete list "${name}"? This removes its items.`)) return
    await deleteList(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your lists</h1>
          <p className="text-sm text-muted-foreground">
            Create separate lists per store or occasion. Reorder to match your routine.
          </p>
        </div>
        <form onSubmit={handleCreate} className="flex w-full max-w-md items-center gap-2">
          <Input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="Add a list (e.g., Costco, Safeway)"
            aria-label="New list name"
          />
          <Button type="submit" disabled={!newListName.trim()}>
            Create
          </Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lists.map((list) => {
          const count = counts[list.id] ?? { total: 0, purchased: 0 }
          return (
            <Card key={list.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {renamingId === list.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        className="h-9"
                        autoFocus
                      />
                      <Button size="sm" type="button" onClick={() => handleRename(list.id)}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <h2 className="text-lg font-semibold">{list.name}</h2>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Updated {formatRelativeTime(list.updatedAt)} • {count.total} items ({count.purchased} purchased)
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    aria-label="Move up"
                    onClick={() => moveList(list.id, -1)}
                    disabled={lists[0]?.id === list.id}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    aria-label="Move down"
                    onClick={() => moveList(list.id, 1)}
                    disabled={lists[lists.length - 1]?.id === list.id}
                  >
                    ↓
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link to={`/list/${list.id}`} className="flex-1" onClick={() => setActiveList(list.id)}>
                  <Button className="w-full" variant="primary">
                    Open list
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setRenamingId(list.id)
                    setRenameValue(list.name)
                  }}
                >
                  Rename
                </Button>
                <Button type="button" variant="outline" onClick={() => handleDelete(list.id, list.name)}>
                  Delete
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {lists.length === 0 && (
        <Card className="text-center text-muted-foreground">
          <p>No lists yet. Create your first list to get started.</p>
        </Card>
      )}
    </div>
  )
}
