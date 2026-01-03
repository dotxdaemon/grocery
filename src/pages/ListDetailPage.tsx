// ABOUTME: Displays a single grocery list with items, quick add, and bulk actions.
// ABOUTME: Supports search, sorting, manual reordering, editing, and history suggestions.
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { DEFAULT_CATEGORY_ORDER } from '../domain/categories'
import { buildHistorySuggestions } from '../domain/history'
import { sortItems } from '../domain/sort'
import type { Item, ItemHistoryEntry, QuantityUnit } from '../domain/types'
import { useAppStore } from '../state/appStore'
import { formatRelativeTime } from '../lib/time'
import { cn } from '../lib/cn'

const quantityLabel = (item: Item) => {
  if (item.quantity === undefined) return ''
  const value = Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(2)
  return `${value}${item.unit ? ` ${item.unit}` : ''}`
}

interface EditItemProps {
  item: Item
  categories: { id: string; name: string }[]
  onSave: (updates: Partial<Item>) => void
}

function EditItemDialog({ item, categories, onSave }: EditItemProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: item.nameOriginal,
    quantity: item.quantity?.toString() ?? '',
    unit: item.unit ?? '',
    notes: item.notes ?? '',
    categoryId: item.categoryId ?? '',
  })

  const resetForm = () =>
    setForm({
      name: item.nameOriginal,
      quantity: item.quantity?.toString() ?? '',
      unit: item.unit ?? '',
      notes: item.notes ?? '',
      categoryId: item.categoryId ?? '',
    })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
          <DialogDescription>Update details, quantities, category, or notes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                inputMode="decimal"
                value={form.quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, categoryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                onSave({
                  name: form.name.trim() || item.name,
                  nameOriginal: form.name.trim() || item.nameOriginal,
                  quantity: form.quantity ? Number.parseFloat(form.quantity) : undefined,
                  unit: (form.unit || undefined) as QuantityUnit | undefined,
                  notes: form.notes,
                  categoryId: form.categoryId || undefined,
                })
                setOpen(false)
              }}
            >
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ItemRowProps {
  item: Item
  categoryName: string
  onToggle: () => void
  onDelete: () => void
  onEdit: (updates: Partial<Item>) => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  manualMode: boolean
  categoryOptions: { id: string; name: string }[]
}

function ItemRow({
  item,
  categoryName,
  onToggle,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
  manualMode,
  categoryOptions,
}: ItemRowProps) {
  return (
    <div className="group flex items-start justify-between gap-3 rounded-md border border-border/70 bg-card/70 px-3 py-2">
      <div className="flex flex-1 items-start gap-3">
        <Checkbox checked={item.isPurchased} onCheckedChange={onToggle} aria-label={`Toggle ${item.name}`} />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('font-medium', item.isPurchased && 'text-muted-foreground line-through')}>
              {item.nameOriginal || item.name}
            </p>
            {item.quantity !== undefined && <Badge variant="outline">{quantityLabel(item)}</Badge>}
            <Badge variant="outline">{categoryName}</Badge>
          </div>
          {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
          {item.purchasedAt && item.isPurchased && (
            <p className="text-xs text-muted-foreground">Purchased {formatRelativeTime(item.purchasedAt)}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        {manualMode && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onMoveUp} aria-label="Move item up">
              ↑
            </Button>
            <Button variant="ghost" size="sm" onClick={onMoveDown} aria-label="Move item down">
              ↓
            </Button>
          </div>
        )}
        <div className="flex gap-1">
          <EditItemDialog item={item} categories={categoryOptions} onSave={onEdit} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm('Delete this item?')) onDelete()
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

interface QuickAddProps {
  categoryOptions: { id: string; name: string }[]
  onAdd: (input: string, categoryId?: string) => Promise<void>
  historySource: ItemHistoryEntry[]
  onToggleFavorite: (id: string) => Promise<void>
}

function QuickAddBar({ categoryOptions, onAdd, historySource, onToggleFavorite }: QuickAddProps) {
  const [input, setInput] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const suggestions = useMemo(
    () => buildHistorySuggestions(input.trim(), historySource),
    [historySource, input],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!input.trim()) return
    setIsSubmitting(true)
    await onAdd(input, categoryId || undefined)
    setInput('')
    setIsSubmitting(false)
  }

  const applySuggestion = (name: string, suggestedCategory?: string) => {
    setInput(name)
    if (suggestedCategory) {
      setCategoryId(suggestedCategory)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card/80 p-3 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Add items fast (e.g., 2 milk, apples 3, 1.5 lb chicken)"
            aria-label="Quick add item"
            autoComplete="off"
          />
          <div className="flex items-center gap-2">
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Auto</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!input.trim() || isSubmitting}>
              Add
            </Button>
          </div>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Saved item suggestions">
            {suggestions.map((entry) => (
              <div key={entry.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applySuggestion(entry.nameCanonical, entry.defaultCategoryId)}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm hover:bg-secondary"
                >
                  <span>{entry.nameCanonical}</span>
                  {entry.isFavorite && <span aria-hidden>★</span>}
                </button>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onToggleFavorite(entry.id)}
                  aria-label={`Toggle favorite for ${entry.nameCanonical}`}
                >
                  {entry.isFavorite ? 'Unstar' : 'Star'}
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  )
}

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const safeId = id ?? ''
  const lists = useAppStore((state) => state.lists)
  const items = useAppStore((state) => state.items)
  const categories = useAppStore((state) => state.categories)
  const itemHistory = useAppStore((state) => state.itemHistory)
  const preferences = useAppStore((state) => state.preferences)
  const addItemQuick = useAppStore((state) => state.addItemQuick)
  const toggleItemPurchased = useAppStore((state) => state.toggleItemPurchased)
  const clearPurchased = useAppStore((state) => state.clearPurchased)
  const setSortMode = useAppStore((state) => state.setSortMode)
  const setMovePurchasedToBottom = useAppStore((state) => state.setMovePurchasedToBottom)
  const setSearchQuery = useAppStore((state) => state.setSearchQuery)
  const updateItem = useAppStore((state) => state.updateItem)
  const deleteItem = useAppStore((state) => state.deleteItem)
  const deleteList = useAppStore((state) => state.deleteList)
  const reorderItems = useAppStore((state) => state.reorderItems)
  const toggleFavoriteHistory = useAppStore((state) => state.toggleFavoriteHistory)
  const setActiveList = useAppStore((state) => state.setActiveList)

  const list = useMemo(() => lists.find((entry) => entry.id === safeId), [lists, safeId])

  useEffect(() => {
    if (safeId) setActiveList(safeId)
  }, [safeId, setActiveList])

  const sortMode = list?.sortMode ?? 'category'
  const categoryOrder = list?.categoryOrder ?? DEFAULT_CATEGORY_ORDER
  const movePurchased = preferences.movePurchasedToBottom[safeId] ?? true
  const searchQuery = preferences.searchQueryByList[safeId] ?? ''

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const listItems = useMemo(
    () => items.filter((item) => item.listId === safeId),
    [items, safeId],
  )

  const sortedItems = useMemo(
    () =>
      sortItems(listItems, categories, {
        sortMode,
        categoryOrder,
        movePurchasedToBottom: movePurchased,
      }),
    [listItems, categories, sortMode, categoryOrder, movePurchased],
  )

  const filteredItems = useMemo(() => {
    if (!searchQuery) return sortedItems
    const query = searchQuery.toLowerCase()
    return sortedItems.filter(
      (item) =>
        item.nameOriginal.toLowerCase().includes(query) || item.name.toLowerCase().includes(query),
    )
  }, [sortedItems, searchQuery])

  const grouped = useMemo(
    () =>
      filteredItems.reduce<Record<string, Item[]>>((acc, item) => {
        const key = item.categoryId ?? 'uncategorized'
        acc[key] = acc[key] ? [...acc[key], item] : [item]
        return acc
      }, {}),
    [filteredItems],
  )

  const handleReorderItem = (itemId: string, delta: number) => {
    const ids = filteredItems.map((item) => item.id)
    const current = ids.indexOf(itemId)
    if (current < 0) return
    const target = current + delta
    if (target < 0 || target >= ids.length) return
    const newOrder = [...ids]
    const [removed] = newOrder.splice(current, 1)
    newOrder.splice(target, 0, removed)
    if (safeId) reorderItems(safeId, newOrder)
  }

  const listCategoryOptions = useMemo(
    () =>
      categoryOrder
        .map((categoryId) => categories.find((category) => category.id === categoryId))
        .filter(Boolean) as { id: string; name: string }[],
    [categoryOrder, categories],
  )

  const order = categoryOrder
  const orderMap = useMemo(
    () => new Map(order.map((categoryId, index) => [categoryId, index])),
    [order],
  )

  if (!list || !id) {
    return (
      <Card className="space-y-3">
        <p className="text-lg font-semibold">List not found</p>
        <Link to="/" className="text-primary hover:underline">
          Back to lists
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-30 border-b border-border bg-background/90 pb-3 pt-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-primary hover:underline">
              ← Back
            </Link>
            <h1 className="text-xl font-semibold">{list.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredItems.length} items</span>
            <span aria-hidden>•</span>
            <span>Updated {formatRelativeTime(list.updatedAt)}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(id, event.target.value)}
            placeholder="Search within this list"
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSortMode(id, list.sortMode === 'category' ? 'manual' : 'category')}>
              Sort: {list.sortMode === 'category' ? 'Category' : 'Manual'}
            </Button>
            <div className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm">
              <Checkbox
                checked={movePurchased}
                onCheckedChange={(checked) => setMovePurchasedToBottom(id, Boolean(checked))}
                aria-label="Move purchased to bottom"
              />
              <span>Move purchased to bottom</span>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm('Clear purchased items?')) clearPurchased(id)
              }}
              disabled={!listItems.some((item) => item.isPurchased)}
            >
              Clear purchased
            </Button>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 z-20">
        <QuickAddBar
          categoryOptions={listCategoryOptions}
          onAdd={(input, categoryId) => addItemQuick(id, input, categoryId)}
          historySource={itemHistory}
          onToggleFavorite={toggleFavoriteHistory}
        />
      </div>

      <div className="space-y-4">
        {Object.entries(grouped)
          .sort((a, b) => {
            const aIndex = orderMap.get(a[0]) ?? order.length + 1
            const bIndex = orderMap.get(b[0]) ?? order.length + 1
            return aIndex - bIndex
          })
          .map(([categoryId, categoryItems]) => (
            <div key={categoryId} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                  {categoryMap.get(categoryId) ?? 'Other'}
                </h2>
                <span className="text-xs text-muted-foreground">{categoryItems.length} items</span>
              </div>
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    categoryName={categoryMap.get(item.categoryId ?? '') ?? 'Other'}
                    onToggle={() => toggleItemPurchased(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    onEdit={(updates) => updateItem(item.id, updates)}
                    onMoveUp={list.sortMode === 'manual' ? () => handleReorderItem(item.id, -1) : undefined}
                    onMoveDown={list.sortMode === 'manual' ? () => handleReorderItem(item.id, 1) : undefined}
                    manualMode={list.sortMode === 'manual'}
                    categoryOptions={listCategoryOptions}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="text-center text-muted-foreground">
          <p>No items yet. Add something to start shopping.</p>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm('Delete this list and its items?')) {
              deleteList(id)
              navigate('/')
            }
          }}
        >
          Delete list
        </Button>
      </div>
    </div>
  )
}
