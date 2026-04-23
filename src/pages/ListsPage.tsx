// ABOUTME: Renders the overview of grocery lists with create, rename, reorder, and delete actions.
// ABOUTME: Serves as the landing page for managing multiple shopping lists.
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()

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

  const handleOpenList = (id: string) => {
    setActiveList(id)
    navigate(`/list/${id}`)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-muted-foreground">
            Your shelves
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Lists</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            A list per store, per occasion, per mood. Reorder to match your route.
          </p>
        </div>
        <form onSubmit={handleCreate} className="flex w-full max-w-md items-center gap-2">
          <Input
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            placeholder="New list (e.g., Costco)"
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
          const progress = count.total === 0 ? 0 : Math.round((count.purchased / count.total) * 100)
          const remaining = Math.max(0, count.total - count.purchased)
          return (
            <Card
              key={list.id}
              className="flex cursor-pointer flex-col gap-4"
              data-testid={`list-card-${list.id}`}
              onClick={(event) => {
                if (renamingId === list.id) return
                const target = event.target as HTMLElement
                if (target.closest('button, a, input, textarea, select')) return
                handleOpenList(list.id)
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
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
                    <h2 className="truncate text-lg font-semibold">
                      <Link
                        to={`/list/${list.id}`}
                        className="text-foreground no-underline transition hover:text-[hsl(var(--color-accent))] focus-visible:underline"
                        onClick={() => setActiveList(list.id)}
                      >
                        {list.name}
                      </Link>
                    </h2>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Updated {formatRelativeTime(list.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
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

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                  <span>
                    <span className="text-base font-semibold text-foreground">{remaining}</span>{' '}
                    {remaining === 1 ? 'item left' : 'items left'}
                  </span>
                  <span className="tabular-nums">{count.purchased}/{count.total}</span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface2)]"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${progress}% purchased`}
                >
                  <div
                    className="prism-shimmer h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundImage: 'var(--prism-gradient)',
                    }}
                  />
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
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <div
            className="prism-shimmer size-12 rounded-full opacity-80"
            style={{ backgroundImage: 'var(--prism-gradient)' }}
            aria-hidden
          />
          <div className="space-y-1">
            <p className="text-lg font-semibold">Start your first list</p>
            <p className="text-sm text-muted-foreground">
              Type a name above — Costco, Safeway, Friday dinner. Whatever.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
