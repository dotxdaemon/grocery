// ABOUTME: Hosts the top-level layout and routing for the grocery PWA.
// ABOUTME: Boots state, renders navigation, and wires pages together.
import { useEffect } from 'react'
import { Link, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import { Button } from './components/ui/button'
import { useAppStore } from './state/appStore'
import { ListDetailPage } from './pages/ListDetailPage'
import { ListsPage } from './pages/ListsPage'
import { SettingsPage } from './pages/SettingsPage'

function NavLinks() {
  const location = useLocation()
  const links = [
    { to: '/', label: 'Lists' },
    { to: '/settings', label: 'Settings' },
  ]
  return (
    <nav className="flex gap-3 text-sm font-medium">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`rounded-md px-3 py-1 hover:bg-secondary ${location.pathname === link.to ? 'bg-secondary text-secondary-foreground' : 'text-foreground'}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

function AppShell() {
  const { init, status, error, lastUndo, undo } = useAppStore((state) => ({
    init: state.init,
    status: state.status,
    error: state.error,
    lastUndo: state.lastUndo,
    undo: state.undo,
  }))

  useEffect(() => {
    if (status === 'idle') {
      init()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  if (status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="size-12 animate-pulse rounded-full bg-primary/30" aria-hidden />
          <p className="text-lg font-semibold">Loading your groceries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Grocery PWA
          </Link>
          <NavLinks />
        </div>
        {error && (
          <div className="bg-amber-900 px-4 py-2 text-sm text-amber-100">
            {error}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
        <Routes>
          <Route path="/" element={<ListsPage />} />
          <Route path="/list/:id" element={<ListDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      {lastUndo && (
        <div className="fixed bottom-4 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 rounded-lg border border-border bg-card/90 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">Undo available</p>
              <p className="text-muted-foreground">{lastUndo.label}</p>
            </div>
            <Button variant="secondary" onClick={undo}>
              Undo
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Router basename="/grocery">
      <AppShell />
    </Router>
  )
}
