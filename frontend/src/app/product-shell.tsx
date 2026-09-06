import { Menu, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { allNavigation, type NavigationItem } from '@/app/navigation'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useOptionalWorkspace } from '@/app/workspace-context'
import { TaskDialog } from '@/features/tasks/task-dialog'

const groups = [
  { label: 'Günlük', paths: ['/', '/tasks', '/focus', '/triggers'] },
  { label: 'Planlama', paths: ['/week', '/day-types', '/calendar', '/categories'] },
  { label: 'Kayıtlar', paths: ['/history'] },
  { label: 'Ayarlar', paths: ['/settings/preferences', '/settings/system'] },
]
const mobilePaths = ['/', '/tasks', '/calendar']

export function ProductShell() {
  const location = useLocation()
  const workspace = useOptionalWorkspace()
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const currentPage = allNavigation.find((item) => item.path === location.pathname) ?? allNavigation[0]
  const groupedLinks = (close?: () => void) => groups.map((group) => <div key={group.label} className="mt-5">
    <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">{group.label}</p>
    {group.paths.map((path) => {
      const item = allNavigation.find((entry) => entry.path === path)!
      return <NavigationLink key={path} item={item} onClick={close} />
    })}
  </div>)

  return <div className="app-canvas min-h-svh text-foreground">
    <a href="#main-content" className="fixed top-3 left-3 z-50 -translate-y-20 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:translate-y-0">İçeriğe geç</a>
    <div className="grid min-h-svh lg:grid-cols-[224px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-svh flex-col overflow-y-auto border-r bg-sidebar px-3 py-5 lg:flex">
        <NavLink to="/" aria-label="ShiftARC ana sayfası" className="flex items-center gap-3 rounded-lg px-3">
          <BrandMark /><span className="font-semibold tracking-tight">ShiftARC<span className="block text-xs font-normal text-muted-foreground">Günün akışı</span></span>
        </NavLink>
        <nav aria-label="Ana navigasyon">{groupedLinks()}</nav>
        <div className="mt-auto px-3 pt-6 text-xs text-muted-foreground"><span className="block truncate">{workspace?.name ?? 'Çalışma alanı'}</span><span className="mt-1 block">{workspace?.timezone ?? 'Yerel ortam'}</span></div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3"><NavLink to="/" className="lg:hidden" aria-label="ShiftARC ana sayfası"><BrandMark /></NavLink><span className="truncate text-sm font-medium">{currentPage.label}</span></div>
          {workspace ? <Button size="sm" onClick={() => setTaskDialogOpen(true)}><Plus className="size-4" aria-hidden="true" />Yeni görev</Button> : null}
        </header>
        <main id="main-content" className="mx-auto w-full max-w-[1800px] min-w-0 px-4 pt-6 pb-28 sm:px-6 lg:pb-10 xl:px-8"><Outlet /></main>
      </div>
    </div>
    <nav aria-label="Mobil navigasyon" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-sidebar px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] lg:hidden">
      {mobilePaths.map((path) => {
        const item = allNavigation.find((entry) => entry.path === path)!
        const Icon = item.icon
        return <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => cn('flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs', isActive ? 'bg-accent text-primary' : 'text-muted-foreground')}><Icon className="size-5" aria-hidden="true" />{item.label}</NavLink>
      })}
      <button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-haspopup="dialog" className={cn('flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs', !mobilePaths.includes(location.pathname) ? 'bg-accent text-primary' : 'text-muted-foreground')}><Menu className="size-5" aria-hidden="true" />Diğer</button>
    </nav>
    <Dialog open={menuOpen} onOpenChange={setMenuOpen}><DialogContent><DialogTitle>Tüm sayfalar</DialogTitle><DialogDescription>Çalışma alanında gezin.</DialogDescription><nav aria-label="Diğer sayfalar">{groupedLinks(() => setMenuOpen(false))}</nav><Button className="mt-5" variant="outline" onClick={() => setMenuOpen(false)}><X className="size-4" />Menüyü kapat</Button></DialogContent></Dialog>
    {taskDialogOpen ? <TaskDialog open onOpenChange={setTaskDialogOpen} /> : null}
  </div>
}
function NavigationLink({ item, onClick }: { item: NavigationItem; onClick?: () => void }) {
  const Icon = item.icon
  return <NavLink to={item.path} end={item.path === '/'} onClick={onClick} className={({ isActive }) => cn('my-0.5 flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent', isActive ? 'bg-accent font-medium text-primary' : 'text-muted-foreground')}><Icon className="size-[18px]" aria-hidden="true" />{item.label}</NavLink>
}
