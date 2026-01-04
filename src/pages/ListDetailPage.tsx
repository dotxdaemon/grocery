// ABOUTME: Displays a single grocery list with items, quick add, and bulk actions.
// ABOUTME: Supports search, sorting, manual reordering, editing, and history suggestions.
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, MoreHorizontal, Search, Sparkles, Tag } from 'lucide-react'
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
import type { Item, ItemHistoryEntry, QuantityUnit, SortMode } from '../domain/types'
import { useAppStore } from '../state/appStore'
import { formatRelativeTime } from '../lib/time'
import { cn } from '../lib/cn'

const UNASSIGNED_CATEGORY_VALUE = 'category-unassigned'
const AUTO_CATEGORY_VALUE = 'category-auto'

// Component structure: TopBar handles navigation, search, and overflow access; ItemList renders grouped items; AddBar keeps quick entry sticky at the bottom; OverflowSheet gathers secondary actions.

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
    categoryId: item.categoryId ?? UNASSIGNED_CATEGORY_VALUE,
  })

  const resetForm = () =>
    setForm({
      name: item.nameOriginal,
      quantity: item.quantity?.toString() ?? '',
      unit: item.unit ?? '',
      notes: item.notes ?? '',
      categoryId: item.categoryId ?? UNASSIGNED_CATEGORY_VALUE,
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
              <SelectItem value={UNASSIGNED_CATEGORY_VALUE}>Unassigned</SelectItem>
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
                  categoryId: form.categoryId === UNASSIGNED_CATEGORY_VALUE ? undefined : form.categoryId,
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
    <div className="group flex items-start justify-between gap-3 rounded-2xl bg-card/70 px-3 py-3 ring-1 ring-border/60">
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
              <ChevronUp className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="sm" onClick={onMoveDown} aria-label="Move item down">
              <ChevronDown className="size-4" aria-hidden />
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

function AddBar({ categoryOptions, onAdd, historySource, onToggleFavorite }: QuickAddProps) {
  const [input, setInput] = useState('')
  const [categoryId, setCategoryId] = useState(AUTO_CATEGORY_VALUE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const suggestions = useMemo(
    () => buildHistorySuggestions(input.trim(), historySource),
    [historySource, input],
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!input.trim()) return
    setIsSubmitting(true)
    await onAdd(input, categoryId === AUTO_CATEGORY_VALUE ? undefined : categoryId)
    setInput('')
    setCategoryId(AUTO_CATEGORY_VALUE)
    setIsSubmitting(false)
  }

  const applySuggestion = (name: string, suggestedCategory?: string) => {
    setInput(name)
    if (suggestedCategory) {
      setCategoryId(suggestedCategory)
    } else {
      setCategoryId(AUTO_CATEGORY_VALUE)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm" aria-label="Saved item suggestions">
            {suggestions.map((entry) => (
              <div key={entry.id} className="flex items-center gap-1 rounded-full bg-card/80 px-3 py-1 ring-1 ring-border/60">
                <button
                  type="button"
                  onClick={() => applySuggestion(entry.nameCanonical, entry.defaultCategoryId)}
                  className="flex items-center gap-1"
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
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-12 justify-center rounded-full border-border" aria-label="Choose category">
              <Tag className="size-4" aria-hidden />
              <SelectValue className="sr-only" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AUTO_CATEGORY_VALUE}>Auto</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Add items (e.g., 2 milk, apples 3)"
            aria-label="Quick add item"
            autoComplete="off"
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isSubmitting} className="h-11 px-5">
            Add
          </Button>
        </form>
      </div>
    </div>
  )
}

interface TopBarProps {
  name: string
  onBack: () => void
  isSearchOpen: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  onToggleSearch: () => void
  onOpenMenu: () => void
}

function TopBar({
  name,
  onBack,
  isSearchOpen,
  searchQuery,
  onSearchChange,
  onToggleSearch,
  onOpenMenu,
}: TopBarProps) {
  return (
    <div className="sticky top-4 z-30 -mx-4 bg-background/90 px-4 pb-3 pt-2 backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-4" aria-hidden />
          <span>Back</span>
        </Button>
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-semibold leading-tight">{name}</h1>
          <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            <Sparkles className="size-3" aria-hidden />
            <span>Kowloon Generic Romance glow</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Search list"
            aria-pressed={isSearchOpen}
            onClick={onToggleSearch}
          >
            <Search className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Open list menu" onClick={onOpenMenu}>
            <MoreHorizontal className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      {isSearchOpen && (
        <div className="mt-3">
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search items"
            className="w-full"
          />
        </div>
      )}
    </div>
  )
}

interface OverflowSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sortMode: SortMode
  movePurchased: boolean
  onChangeSort: (mode: SortMode) => void
  onToggleMovePurchased: (value: boolean) => void
  onClearPurchased: () => void
  canClearPurchased: boolean
  onDeleteList: () => void
  itemCount: number
  purchasedCount: number
  updatedAt: number
}

function OverflowSheet({
  open,
  onOpenChange,
  sortMode,
  movePurchased,
  onChangeSort,
  onToggleMovePurchased,
  onClearPurchased,
  canClearPurchased,
  onDeleteList,
  itemCount,
  purchasedCount,
  updatedAt,
}: OverflowSheetProps) {
  const sortOptions: { label: string; helper: string; value: SortMode }[] = [
    { label: 'Category', helper: 'Group by aisle and section', value: 'category' },
    { label: 'A–Z', helper: 'Alphabetical for quick scanning', value: 'alpha' },
    { label: 'Recently added', helper: 'Newest captures first', value: 'recent' },
    { label: 'Manual', helper: 'Keep your custom order', value: 'manual' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bottom-0 left-1/2 top-auto max-w-2xl -translate-x-1/2 translate-y-0 rounded-t-3xl border-border/70 bg-card/95 pb-6 shadow-[0_-20px_80px_rgba(0,0,0,0.55)] sm:rounded-2xl">
        <DialogHeader className="mb-1">
          <DialogTitle>List options</DialogTitle>
          <DialogDescription>Secondary actions stay tucked in this sheet.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Sort</p>
            <div className="grid grid-cols-2 gap-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={sortMode === option.value ? 'primary' : 'outline'}
                  className="h-auto w-full justify-start gap-2 px-3 py-2 text-left"
                  onClick={() => onChangeSort(option.value)}
                  aria-pressed={sortMode === option.value}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.helper}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary/40 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Move purchased to bottom</p>
              <p className="text-xs text-muted-foreground">Keep checked items out of the way.</p>
            </div>
            <Checkbox
              checked={movePurchased}
              onCheckedChange={(checked) => onToggleMovePurchased(Boolean(checked))}
              aria-label="Move purchased to bottom"
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-2 text-sm">
            <p className="font-medium">List details</p>
            <p className="text-muted-foreground">
              {itemCount} items • {purchasedCount} purchased
            </p>
            <p className="text-muted-foreground">Updated {formatRelativeTime(updatedAt)}</p>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-auto w-full justify-between px-3 py-3"
              onClick={onClearPurchased}
              disabled={!canClearPurchased}
            >
              <span className="font-medium">Clear purchased</span>
              <span className="text-xs text-muted-foreground">Remove checked items</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-auto w-full justify-between px-3 py-3"
              onClick={onDeleteList}
            >
              <span className="font-medium">Delete list</span>
              <span className="text-xs text-destructive-foreground">Also deletes items</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(list ? preferences.searchQueryByList[list.id] : false))
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  useEffect(() => {
    if (safeId) setActiveList(safeId)
  }, [safeId, setActiveList])

  const sortMode = list?.sortMode ?? 'category'
  const categoryOrder = list?.categoryOrder ?? DEFAULT_CATEGORY_ORDER
  const movePurchased = preferences.movePurchasedToBottom[safeId] ?? true
  const searchQuery = preferences.searchQueryByList[safeId] ?? ''

  useEffect(() => {
    if (searchQuery && !isSearchOpen) {
      setIsSearchOpen(true)
    }
  }, [isSearchOpen, searchQuery])

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

  const grouped = useMemo(() => {
    if (sortMode !== 'category') {
      return { all: filteredItems }
    }
    return filteredItems.reduce<Record<string, Item[]>>((acc, item) => {
      const key = item.categoryId ?? 'uncategorized'
      acc[key] = acc[key] ? [...acc[key], item] : [item]
      return acc
    }, {})
  }, [filteredItems, sortMode])
  const purchasedCount = useMemo(
    () => listItems.filter((item) => item.isPurchased).length,
    [listItems],
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

  const order = sortMode === 'category' ? categoryOrder : ['all']
  const orderMap = useMemo(() => new Map(order.map((categoryId, index) => [categoryId, index])), [order])

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

  const toggleSearch = () => {
    if (isSearchOpen) {
      setIsSearchOpen(false)
      setSearchQuery(id, '')
    } else {
      setIsSearchOpen(true)
    }
  }

  const handleClearPurchased = () => {
    if (window.confirm('Clear purchased items?')) clearPurchased(id)
  }

  const handleDeleteList = () => {
    if (window.confirm('Delete this list and its items?')) {
      deleteList(id)
      navigate('/')
    }
  }

  return (
    <div className="relative mx-auto max-w-3xl pb-32 pt-4">
      <TopBar
        name={list.name}
        onBack={() => navigate('/')}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        onSearchChange={(value) => setSearchQuery(id, value)}
        onToggleSearch={toggleSearch}
        onOpenMenu={() => setIsSheetOpen(true)}
      />

      <div className="mt-3 space-y-5">
        {Object.entries(grouped)
          .sort((a, b) => {
            const aIndex = orderMap.get(a[0]) ?? order.length + 1
            const bIndex = orderMap.get(b[0]) ?? order.length + 1
            return aIndex - bIndex
          })
          .map(([categoryId, categoryItems]) => (
            <div key={categoryId} className="space-y-2">
              {sortMode === 'category' && (
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {categoryMap.get(categoryId) ?? 'Other'}
                  </h2>
                  <span className="text-xs text-muted-foreground">{categoryItems.length} items</span>
                </div>
              )}
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

        {filteredItems.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card/70 p-6 text-center">
            <p className="font-semibold">No items yet</p>
            <p className="text-sm text-muted-foreground">Use the add bar below to capture ingredients fast.</p>
          </div>
        )}
      </div>

      <OverflowSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        sortMode={list.sortMode}
        movePurchased={movePurchased}
        onChangeSort={(mode) => setSortMode(id, mode)}
        onToggleMovePurchased={(value) => setMovePurchasedToBottom(id, value)}
        onClearPurchased={handleClearPurchased}
        canClearPurchased={purchasedCount > 0}
        onDeleteList={handleDeleteList}
        itemCount={listItems.length}
        purchasedCount={purchasedCount}
        updatedAt={list.updatedAt}
      />

      <AddBar
        categoryOptions={listCategoryOptions}
        onAdd={(input, categoryId) => addItemQuick(id, input, categoryId)}
        historySource={itemHistory}
        onToggleFavorite={toggleFavoriteHistory}
      />
    </div>
  )
}
