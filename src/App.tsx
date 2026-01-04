// ABOUTME: Hosts the top-level layout and routing for the grocery PWA.
// ABOUTME: Boots state, renders navigation, and wires pages together.
import { useEffect, useMemo, useRef } from 'react'
import { Link, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
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
    <nav className="flex gap-2 text-xs font-semibold uppercase tracking-[0.08em]">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`relative overflow-hidden rounded-full border border-border/60 px-4 py-2 transition hover:border-primary/40 hover:text-primary ${location.pathname === link.to ? 'bg-primary/15 text-primary shadow-[0_0_24px_rgba(233,118,255,0.2)]' : 'text-muted-foreground'}`}
        >
          <span className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-60" aria-hidden />
          <span className="relative">{link.label}</span>
        </Link>
      ))}
    </nav>
  )
}

function AppShell() {
  const init = useAppStore((state) => state.init)
  const status = useAppStore((state) => state.status)
  const error = useAppStore((state) => state.error)
  const hasInitialized = useRef(false)
  const location = useLocation()
  const isListView = useMemo(() => location.pathname.startsWith('/list/'), [location.pathname])

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true
      init()
    }
  }, [])

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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(233,118,255,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_75%_75%,rgba(34,211,238,0.18),transparent_35%)] blur-3xl"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_40%,rgba(255,255,255,0)_65%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:140px_140px] opacity-60"
          aria-hidden
        />
      </div>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="relative flex items-center gap-3">
            <div className="absolute -left-3 -top-3 h-12 w-12 rounded-full bg-primary/25 blur-2xl" aria-hidden />
            <Link to="/" className="relative flex flex-col leading-none no-underline">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                grocery list
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Night market errands
              </span>
            </Link>
          </div>
          {!isListView && <NavLinks />}
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-70" aria-hidden />
        {error && (
          <div className="bg-amber-900/90 px-4 py-2 text-sm text-amber-100 backdrop-blur">
            {error}
          </div>
        )}
      </header>
      <main className="relative mx-auto max-w-5xl px-4 pb-24 pt-6">
        <div className="pointer-events-none absolute inset-x-8 top-2 h-20 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <Routes>
          <Route path="/" element={<ListsPage />} />
          <Route path="/list/:id" element={<ListDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
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
