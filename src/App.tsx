// ABOUTME: Hosts the top-level layout and routing for the grocery PWA.
// ABOUTME: Boots state, renders navigation, and wires pages together.
import { useEffect, useMemo, useRef } from 'react'
import { Link, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useAppStore } from './state/appStore'
import { ListDetailPage } from './pages/ListDetailPage'
import { ListsPage } from './pages/ListsPage'
import { SettingsPage } from './pages/SettingsPage'
import { UndoToast } from './components/UndoToast'
import { cn } from './lib/cn'

function NavLinks() {
  const location = useLocation()
  const links = [
    { to: '/', label: 'Lists' },
    { to: '/settings', label: 'Settings' },
  ]
  return (
    <nav className="flex gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
      {links.map((link) => {
        const isActive = location.pathname === link.to
        return (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              'relative overflow-hidden rounded-full border px-4 py-2 transition',
              isActive
                ? 'prism-border border-transparent text-foreground'
                : 'border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground',
            )}
          >
            <span className="relative">{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function ThemeToggle() {
  const themeMode = useAppStore((state) => state.preferences.themeMode ?? 'light')
  const setThemeMode = useAppStore((state) => state.setThemeMode)
  const isDark = themeMode === 'dark'
  return (
    <button
      type="button"
      onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative inline-flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/50 text-foreground transition hover:border-foreground/40 hover:bg-background/80"
    >
      {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
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
  }, [init])

  if (status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="prism-shimmer size-14 rounded-full"
            style={{ backgroundImage: 'var(--prism-gradient)' }}
            aria-hidden
          />
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Loading
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -left-24 top-20 size-[520px] rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--prism-1) / 0.35), transparent 70%)' }} />
        <div className="absolute -right-20 top-0 size-[420px] rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--prism-2) / 0.30), transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[520px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(closest-side, hsl(var(--prism-5) / 0.28), transparent 70%)' }} />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 p-4">
          <Link to="/" className="group relative flex items-center gap-3 no-underline">
            <span
              className="prism-shimmer inline-block size-2.5 rounded-full"
              style={{ backgroundImage: 'var(--prism-gradient)' }}
              aria-hidden
            />
            <span className="prism-text prism-shimmer text-[11px] font-bold uppercase tracking-[0.38em]">
              grocery
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {!isListView && <NavLinks />}
            <ThemeToggle />
          </div>
        </div>
        <div
          className="h-px opacity-70"
          style={{ backgroundImage: 'var(--prism-gradient)' }}
          aria-hidden
        />
        {error && (
          <div className="bg-amber-900/90 px-4 py-2 text-sm text-amber-100 backdrop-blur">
            {error}
          </div>
        )}
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-24 pt-6">
        <Routes>
          <Route path="/" element={<ListsPage />} />
          <Route path="/list/:id" element={<ListDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <UndoToast />
    </div>
  )
}

export default function App() {
  const themeMode = useAppStore((state) => state.preferences.themeMode ?? 'light')
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '')
  const basename = baseUrl === '' ? '/' : baseUrl

  useEffect(() => {
    document.body.classList.add('theme-berry-mint-mint-primary')
    return () => {
      document.body.classList.remove('theme-berry-mint-mint-primary')
      document.body.classList.remove('theme-dark')
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('theme-dark', themeMode === 'dark')
  }, [themeMode])

  return (
    <Router basename={basename}>
      <AppShell />
    </Router>
  )
}
