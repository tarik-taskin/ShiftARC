import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'

import { ProductShell } from '@/app/product-shell'
import { WorkspaceGate } from '@/app/workspace-gate'
import { TodayPage } from '@/pages/today-page'
import { SystemStatusPage } from '@/pages/system-status-page'
import { WorkspacePreferencesPage } from '@/pages/workspace-preferences-page'

const CategoriesPage = lazy(() =>
  import('@/pages/categories-page').then((module) => ({
    default: module.CategoriesPage,
  })),
)

const DayTypesPage = lazy(() =>
  import('@/pages/day-types-page').then((module) => ({
    default: module.DayTypesPage,
  })),
)

const WeeklyPlanPage = lazy(() =>
  import('@/pages/weekly-plan-page').then((module) => ({
    default: module.WeeklyPlanPage,
  })),
)

const TasksPage = lazy(() =>
  import('@/pages/tasks-page').then((module) => ({ default: module.TasksPage })),
)

const TriggersPage = lazy(() =>
  import('@/pages/triggers-page').then((module) => ({ default: module.TriggersPage })),
)

const FocusPage = lazy(() =>
  import('@/pages/focus-page').then((module) => ({ default: module.FocusPage })),
)

const HistoryPage = lazy(() =>
  import('@/pages/history-page').then((module) => ({ default: module.HistoryPage })),
)

const CalendarPage = lazy(() =>
  import('@/pages/calendar-page').then((module) => ({ default: module.CalendarPage })),
)

function App() {
  const location = useLocation()

  if (location.pathname === '/settings/system') {
    return <ProductRoutes />
  }

  return (
    <WorkspaceGate>
      <ProductRoutes />
    </WorkspaceGate>
  )
}

function ProductRoutes() {
  return (
    <Routes>
      <Route element={<ProductShell />}>
        <Route index element={<TodayPage />} />
        <Route
          path="week"
          element={
            <Suspense fallback={<div role="status">Haftalık plan yükleniyor…</div>}>
              <WeeklyPlanPage />
            </Suspense>
          }
        />
        <Route
          path="day-types"
          element={
            <Suspense fallback={<div role="status">Gün tipleri yükleniyor…</div>}>
              <DayTypesPage />
            </Suspense>
          }
        />
        <Route
          path="tasks"
          element={
            <Suspense fallback={<div role="status">Görevler yükleniyor…</div>}><TasksPage /></Suspense>
          }
        />
        <Route
          path="categories"
          element={
            <Suspense fallback={<div role="status">Kategoriler yükleniyor…</div>}>
              <CategoriesPage />
            </Suspense>
          }
        />
        <Route path="triggers" element={<Suspense fallback={<div role="status">Triggerlar yükleniyor…</div>}><TriggersPage /></Suspense>} />
        <Route path="focus" element={<Suspense fallback={<div role="status">Odak sayacı yükleniyor…</div>}><FocusPage /></Suspense>} />
        <Route path="calendar" element={<Suspense fallback={<div role="status">Planlama takvimi yükleniyor…</div>}><CalendarPage /></Suspense>} />
        <Route
          path="history"
          element={<Suspense fallback={<div role="status">Geçmiş yükleniyor…</div>}><HistoryPage /></Suspense>}
        />
        <Route path="settings/preferences" element={<WorkspacePreferencesPage />} />
        <Route path="settings/system" element={<SystemStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
