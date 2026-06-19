import { Navigate, Route, Routes } from 'react-router-dom'
import { useLocation } from 'react-router-dom'

import { ProductShell } from '@/app/product-shell'
import { WorkspaceGate } from '@/app/workspace-gate'
import { FeaturePage, TodayPage } from '@/pages/feature-page'
import { SystemStatusPage } from '@/pages/system-status-page'
import { WorkspacePreferencesPage } from '@/pages/workspace-preferences-page'

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
            <FeaturePage
              eyebrow="Haftalık ritim"
              title="Her güne doğru karakteri ver."
              description="Pazartesiden pazara tekrarlayan gün tipi düzeni burada kurulacak."
              nextStep="Gün tipleri ve haftalık şablon Faz 5–6'da etkinleşecek."
            />
          }
        />
        <Route
          path="day-types"
          element={
            <FeaturePage
              eyebrow="Zaman mimarisi"
              title="Bir günü blok blok tasarla."
              description="00:00–24:00 çizelgesini bölerek zaman bloklarını ve kabul ettikleri kategorileri yöneteceksin."
              nextStep="Etkileşimli zaman çizelgesi Faz 5'te eklenecek."
            />
          }
        />
        <Route
          path="tasks"
          element={
            <FeaturePage
              eyebrow="Görev merkezi"
              title="İşlerini ve alışkanlıklarını tek yerde tut."
              description="Son tarihli iş parçacıkları ile haftalık hedefli alışkanlıklar aynı çalışma alanında yönetilecek."
              nextStep="Görev domain'i Faz 7'de bağlanacak."
            />
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
