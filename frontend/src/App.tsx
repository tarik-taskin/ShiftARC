import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'

import { ProductShell } from '@/app/product-shell'
import { WorkspaceGate } from '@/app/workspace-gate'
import { FeaturePage } from '@/pages/feature-page'
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
        <Route
          path="history"
          element={
            <FeaturePage
              eyebrow="Gerçekleşen zaman"
              title="Plan ile gerçeği yan yana gör."
              description="Günlük snapshot'lar, gerçekleşen çalışma süreleri ve düzeltmeler takvim üzerinde incelenecek."
              nextStep="Takvim ve olay geçmişi Faz 13'te eklenecek."
            />
          }
        />
        <Route path="settings/preferences" element={<WorkspacePreferencesPage />} />
        <Route path="settings/system" element={<SystemStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
