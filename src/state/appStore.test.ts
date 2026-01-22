// ABOUTME: Verifies critical behaviors of the Zustand app store.
// ABOUTME: Covers list creation, quick-add flows, purchase toggles, and undo snapshots.
import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './appStore'
import { resetAppStore } from '../test/storeHelpers'

describe('app store', () => {
  beforeEach(() => {
    resetAppStore()
  })

  it('creates a list and tracks undo', async () => {
    await useAppStore.getState().createList('Weekend')
    const state = useAppStore.getState()
    expect(state.lists).toHaveLength(1)
    expect(state.preferences.activeListId).toBe(state.lists[0].id)
    expect(state.lastUndo?.label).toBe('Created list')
  })

  it('infers category from history when quick-adding', async () => {
    const store = useAppStore.getState()
    await store.createList('Groceries')
    const listId = useAppStore.getState().lists[0].id
    await store.addItemQuick(listId, 'bananas', 'produce')
    await store.addItemQuick(listId, 'bananas')

    const items = useAppStore.getState().items.filter((item) => item.listId === listId)
    expect(items).toHaveLength(2)
    expect(items[1].categoryId).toBe('produce')

    const historyEntry = useAppStore.getState().itemHistory.find((entry) => entry.nameCanonical === 'bananas')
    expect(historyEntry?.timesUsed).toBe(2)
  })

  it('marks purchased items with timestamps and history updates', async () => {
    const store = useAppStore.getState()
    await store.createList('Run')
    const listId = useAppStore.getState().lists[0].id
    await store.addItemQuick(listId, 'milk', 'dairy')
    const item = useAppStore.getState().items[0]
    await store.toggleItemPurchased(item.id)
    const updated = useAppStore.getState().items[0]
    expect(updated.isPurchased).toBe(true)
    expect(updated.purchasedAt).toBeDefined()

    const historyEntry = useAppStore.getState().itemHistory.find((entry) => entry.nameCanonical === 'milk')
    expect(historyEntry?.timesUsed).toBe(2)
  })

  it('restores prior state on undo', async () => {
    const store = useAppStore.getState()
    await store.createList('Undo Test')
    const listId = useAppStore.getState().lists[0].id
    await store.addItemQuick(listId, 'apples')
    const addedId = useAppStore.getState().items[0].id
    await store.deleteItem(addedId)
    expect(useAppStore.getState().items).toHaveLength(0)
    await store.undo()
    expect(useAppStore.getState().items).toHaveLength(1)
  })

  it('adds multiple items from a delimited quick-add string with a single undo baseline', async () => {
    const store = useAppStore.getState()
    await store.createList('Batch')
    const listId = useAppStore.getState().lists[0].id

    await store.addItemQuick(listId, 'apples, bananas; carrots')

    const items = useAppStore.getState().items
    expect(items).toHaveLength(3)
    expect(useAppStore.getState().lastUndo?.label).toBe('Added item')
    expect(useAppStore.getState().lastUndo?.snapshot.items).toHaveLength(0)
  })

  it('adds each non-empty line as an item for multi-line quick add', async () => {
    const store = useAppStore.getState()
    await store.createList('Paste')
    const listId = useAppStore.getState().lists[0].id

    await store.addItemQuick(listId, '1 cup sugar\n2 eggs\n1 cup flour')

    const items = useAppStore.getState().items.filter((item) => item.listId === listId)
    expect(items).toHaveLength(3)
  })

  it('clears undo metadata when requested', async () => {
    const store = useAppStore.getState()
    await store.createList('Clearable')

    expect(useAppStore.getState().lastUndo).toBeDefined()
    await store.clearUndo()
    expect(useAppStore.getState().lastUndo).toBeUndefined()
  })
})
