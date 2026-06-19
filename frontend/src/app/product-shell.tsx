import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Activity, ArrowUpRight } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import {
  allNavigation,
  primaryNavigation,
  utilityNavigation,
  type NavigationItem,
} from '@/app/navigation'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ProductShell() {
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const currentPage =
    allNavigation.find((item) => item.path === location.pathname) ??
    primaryNavigation[0]

  return (
    <div className="app-canvas min-h-svh bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:translate-y-0"
      >
        İçeriğe geç
      </a>

      <div className="mx-auto grid min-h-svh w-full max-w-[1600px] lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-svh flex-col border-r border-border/70 bg-sidebar/82 px-5 py-6 backdrop-blur-2xl lg:flex">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-2xl px-2 py-1 text-foreground"
            aria-label="ShiftARC ana sayfası"
          >
            <BrandMark />
            <span>
              <span className="block text-sm font-bold tracking-[-0.02em]">
                ShiftARC
              </span>
              <span className="block font-mono text-[10px] text-muted-foreground">
                local workspace · 0.1.0
              </span>
            </span>
          </NavLink>

          <nav className="mt-10 space-y-1" aria-label="Ana navigasyon">
            {primaryNavigation.map((item) => (
              <DesktopNavigationLink key={item.path} item={item} />
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/55 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
                Lokal çalışma alanı
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Ürün iskeleti hazır. Domain modülleri sırayla bağlanacak.
              </p>
            </div>
            {utilityNavigation.map((item) => (
              <DesktopNavigationLink key={item.path} item={item} />
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-border/60 bg-background/78 px-5 backdrop-blur-2xl sm:px-8 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <NavLink
                to="/"
                className="shrink-0 lg:hidden"
                aria-label="ShiftARC ana sayfası"
              >
                <BrandMark className="size-8" />
              </NavLink>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold tracking-[0.12em] text-primary uppercase">
                  {currentPage.label}
                </p>
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  {currentPage.description}
                </p>
              </div>
            </div>

            <Button asChild variant="outline" size="sm">
              <NavLink
                to="/settings/system"
                aria-label="Sistem durumunu aç"
              >
                <Activity className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sistem durumu</span>
                <ArrowUpRight className="size-3.5 opacity-60" aria-hidden="true" />
              </NavLink>
            </Button>
          </header>

          <AnimatePresence mode="wait" initial={false}>
            <motion.main
              id="main-content"
              key={location.pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
              className="mx-auto w-full max-w-[1280px] px-5 pt-8 pb-28 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12"
            >
              <Outlet />
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-border/75 bg-sidebar/92 p-1.5 shadow-2xl shadow-black/25 backdrop-blur-2xl lg:hidden"
        aria-label="Mobil navigasyon"
      >
        {primaryNavigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-muted-foreground transition-colors',
                  isActive && 'bg-primary/12 text-primary',
                )
              }
            >
              <Icon className="size-[18px]" aria-hidden="true" />
              <span className="truncate">{item.shortLabel ?? item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

function DesktopNavigationLink({ item }: { item: NavigationItem }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground',
          isActive && 'bg-primary/12 text-primary',
        )
      }
    >
      <Icon className="size-[18px]" aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  )
}
