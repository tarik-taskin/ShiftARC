import './App.css'

import { useSystemStatus } from './api/system-status/useSystemStatus'
import type {
  SystemStatusClientError,
  SystemStatusRequestState,
} from './api/system-status/types'

type StatusTone = 'up' | 'checking' | 'down' | 'unknown'

interface StatusCardProps {
  label: string
  technology: string
  value: string
  detail: string
  endpoint: string
  tone: StatusTone
}

function App() {
  const { state, refresh } = useSystemStatus()
  const apiStatus = getApiStatus(state)
  const databaseStatus = getDatabaseStatus(state)
  const isLoading = state.phase === 'loading'

  return (
    <main className="foundation-shell">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="/" aria-label="ShiftARC ana sayfası">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>ShiftARC</span>
        </a>
        <span className="version-badge">v0.0.1 · local foundation</span>
      </header>

      <section className="hero-section" aria-labelledby="page-title">
        <p className="eyebrow">Teknik doğrulama ekranı</p>
        <h1 id="page-title">Yerel geliştirme ortamı</h1>
        <p className="hero-copy">
          React, Spring Boot ve PostgreSQL arasındaki bağlantıyı tek bakışta
          doğrulayın. Bu ekran ürün ana sayfası değil, ShiftARC temelinin sağlık
          kontrolüdür.
        </p>
      </section>

      <section className="status-panel" aria-labelledby="status-heading">
        <div className="status-panel-header">
          <div aria-live="polite">
            <p className="section-label">Sistem durumu</p>
            <h2 id="status-heading">{getOverallStatus(state)}</h2>
          </div>
          <button
            className="retry-button"
            type="button"
            onClick={refresh}
            disabled={isLoading}
          >
            <span className={isLoading ? 'retry-icon is-spinning' : 'retry-icon'}>
              ↻
            </span>
            {isLoading ? 'Kontrol ediliyor' : 'Yeniden kontrol et'}
          </button>
        </div>

        <div className="status-grid" aria-live="polite">
          <StatusCard
            label="Frontend"
            technology="React + Vite"
            value="Çalışıyor"
            detail="Arayüz tarayıcıda başarıyla yüklendi."
            endpoint="localhost:5173"
            tone="up"
          />
          <StatusCard
            label="API"
            technology="Spring Boot"
            value={apiStatus.value}
            detail={apiStatus.detail}
            endpoint="localhost:8080"
            tone={apiStatus.tone}
          />
          <StatusCard
            label="Veritabanı"
            technology="PostgreSQL 16"
            value={databaseStatus.value}
            detail={databaseStatus.detail}
            endpoint="localhost:5432"
            tone={databaseStatus.tone}
          />
        </div>

        {state.phase === 'error' ? (
          <div className="error-notice" role="alert">
            <span className="error-symbol" aria-hidden="true">
              !
            </span>
            <div>
              <strong>Bağlantı doğrulanamadı</strong>
              <p>{getErrorMessage(state.error)}</p>
            </div>
          </div>
        ) : null}
      </section>

      <footer className="foundation-footer">
        <span>ShiftARC 0.0.1</span>
        <span aria-hidden="true">•</span>
        <span>Lokal teknik temel</span>
      </footer>
    </main>
  )
}

function StatusCard({
  label,
  technology,
  value,
  detail,
  endpoint,
  tone,
}: StatusCardProps) {
  return (
    <article className={`status-card status-${tone}`}>
      <div className="card-heading">
        <div>
          <p className="card-label">{label}</p>
          <h3>{technology}</h3>
        </div>
        <span className="status-dot" aria-hidden="true" />
      </div>
      <p className="status-value">{value}</p>
      <p className="status-detail">{detail}</p>
      <code>{endpoint}</code>
    </article>
  )
}

function getOverallStatus(state: SystemStatusRequestState): string {
  if (state.phase === 'loading') {
    return 'Bağlantılar kontrol ediliyor'
  }

  if (state.phase === 'success') {
    return 'Tüm servisler hazır'
  }

  return 'Kurulum doğrulaması gerekiyor'
}

function getApiStatus(state: SystemStatusRequestState) {
  if (state.phase === 'loading') {
    return {
      tone: 'checking' as const,
      value: 'Kontrol ediliyor',
      detail: 'API yanıtı bekleniyor.',
    }
  }

  if (state.phase === 'success') {
    return {
      tone: 'up' as const,
      value: 'Çalışıyor',
      detail: `${state.data.service} · v${state.data.version}`,
    }
  }

  if (state.error.kind === 'http') {
    const isGatewayUnavailable =
      state.error.statusCode === 502 || state.error.statusCode === 504

    if (isGatewayUnavailable) {
      return {
        tone: 'down' as const,
        value: 'Ulaşılamıyor',
        detail: 'Vite proxy Spring Boot API bağlantısını kuramadı.',
      }
    }

    return {
      tone: state.error.statusCode === 503 ? ('up' as const) : ('down' as const),
      value: state.error.statusCode === 503 ? 'Yanıt veriyor' : 'Hata döndü',
      detail: `HTTP ${state.error.statusCode ?? 'hatası'} alındı.`,
    }
  }

  if (state.error.kind === 'invalid-response') {
    return {
      tone: 'down' as const,
      value: 'Uyumsuz yanıt',
      detail: 'API yanıtı beklenen sözleşmeyle eşleşmedi.',
    }
  }

  return {
    tone: 'down' as const,
    value: 'Ulaşılamıyor',
    detail: 'Spring Boot API bağlantısı kurulamadı.',
  }
}

function getDatabaseStatus(state: SystemStatusRequestState) {
  if (state.phase === 'loading') {
    return {
      tone: 'checking' as const,
      value: 'Kontrol ediliyor',
      detail: 'API üzerinden veritabanı yanıtı bekleniyor.',
    }
  }

  if (state.phase === 'success') {
    return {
      tone: 'up' as const,
      value: 'Bağlı',
      detail: 'SELECT 1 sağlık kontrolü başarılı.',
    }
  }

  if (state.error.kind === 'http' && state.error.statusCode === 503) {
    return {
      tone: 'down' as const,
      value: 'Bağlantı yok',
      detail: 'API veritabanı sağlık kontrolünü tamamlayamadı.',
    }
  }

  return {
    tone: 'unknown' as const,
    value: 'Doğrulanamadı',
    detail: 'API erişilemediği için veritabanı durumu bilinmiyor.',
  }
}

function getErrorMessage(error: SystemStatusClientError): string {
  switch (error.kind) {
    case 'timeout':
      return 'API zamanında yanıt vermedi. Backend sürecinin çalıştığını kontrol edin.'
    case 'network':
      return 'Spring Boot API erişilemiyor. Backend sürecini başlatıp tekrar deneyin.'
    case 'http':
      if (error.statusCode === 502 || error.statusCode === 504) {
        return 'Vite proxy Spring Boot API sürecine ulaşamadı. Backend sürecini başlatıp tekrar deneyin.'
      }

      return error.statusCode === 503
        ? 'API çalışıyor ancak PostgreSQL bağlantısı kurulamadı. Lokal DB ayarlarını kontrol edin.'
        : `API beklenmeyen bir HTTP ${error.statusCode ?? ''} yanıtı döndürdü.`
    case 'invalid-response':
      return 'API yanıtı ShiftARC sistem durumu sözleşmesiyle eşleşmiyor.'
    case 'aborted':
      return 'Durum kontrolü iptal edildi.'
  }
}

export default App
