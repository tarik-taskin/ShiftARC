import { AlertTriangle, Database, RefreshCw, Server, Waypoints } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSystemStatus } from '@/api/system-status/useSystemStatus'
import type {
  SystemStatusClientError,
  SystemStatusRequestState,
} from '@/api/system-status/types'
import { cn } from '@/lib/utils'

type StatusTone = 'up' | 'checking' | 'down' | 'unknown'

interface StatusCardProps {
  label: string
  technology: string
  value: string
  detail: string
  endpoint: string
  tone: StatusTone
  icon: typeof Server
}

export function SystemStatusPage() {
  const { state, refresh } = useSystemStatus()
  const apiStatus = getApiStatus(state)
  const databaseStatus = getDatabaseStatus(state)
  const isLoading = state.phase === 'loading'

  return (
    <div className="space-y-6">
      <section className="max-w-3xl pt-4 sm:pt-8">
        <p className="section-kicker">Teknik doğrulama</p>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight sm:text-[32px]">
          Lokal sistem durumu
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          React, Spring Boot ve PostgreSQL arasındaki bağlantıyı buradan takip
          edebilirsin. Bu ekran ürün navigasyonunun kalıcı teknik kontrol
          noktasıdır.
        </p>
      </section>

      <section className="rounded-xl border border-border/75 bg-card p-5 shadow-lg shadow-black/5 backdrop-blur-xl sm:p-7" aria-labelledby="status-heading">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            <p className="section-kicker">Sistem durumu</p>
            <h2 id="status-heading" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
              {getOverallStatus(state)}
            </h2>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={isLoading}
            aria-label={isLoading ? 'Kontrol ediliyor' : 'Yeniden kontrol et'}
          >
            <RefreshCw
              className={cn('size-4', isLoading && 'animate-spin')}
              aria-hidden="true"
            />
            {isLoading ? 'Kontrol ediliyor' : 'Yeniden kontrol et'}
          </Button>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3" aria-live="polite">
          <StatusCard
            label="Frontend"
            technology="React + Vite"
            value="Çalışıyor"
            detail="Arayüz tarayıcıda başarıyla yüklendi."
            endpoint="127.0.0.1:5173"
            tone="up"
            icon={Waypoints}
          />
          <StatusCard
            label="API"
            technology="Spring Boot"
            value={apiStatus.value}
            detail={apiStatus.detail}
            endpoint="127.0.0.1:8080"
            tone={apiStatus.tone}
            icon={Server}
          />
          <StatusCard
            label="Veritabanı"
            technology="PostgreSQL 16"
            value={databaseStatus.value}
            detail={databaseStatus.detail}
            endpoint="127.0.0.1:5432"
            tone={databaseStatus.tone}
            icon={Database}
          />
        </div>

        {state.phase === 'error' ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/8 p-4" role="alert">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
            <div>
              <strong className="text-sm text-foreground">
                Bağlantı doğrulanamadı
              </strong>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {getErrorMessage(state.error)}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function StatusCard({
  label,
  technology,
  value,
  detail,
  endpoint,
  tone,
  icon: Icon,
}: StatusCardProps) {
  return (
    <article className="min-h-60 rounded-lg border border-border/70 bg-background/35 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {label}
          </p>
          <h3 className="mt-1 text-base font-semibold">{technology}</h3>
        </div>
        <div className="relative grid size-9 place-items-center rounded-xl bg-accent text-muted-foreground">
          <Icon className="size-4" aria-hidden="true" />
          <span className={cn('status-dot', `status-${tone}`)} aria-hidden="true" />
        </div>
      </div>
      <p className={cn('mt-9 text-xl font-semibold tracking-[-0.035em]', getToneClassName(tone))}>
        {value}
      </p>
      <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
        {detail}
      </p>
      <code className="mt-4 inline-flex rounded-lg border border-border/70 bg-muted/60 px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
        {endpoint}
      </code>
    </article>
  )
}

function getToneClassName(tone: StatusTone) {
  return {
    up: 'text-success',
    checking: 'text-warning',
    down: 'text-destructive',
    unknown: 'text-muted-foreground',
  }[tone]
}

function getOverallStatus(state: SystemStatusRequestState): string {
  if (state.phase === 'loading') return 'Bağlantılar kontrol ediliyor'
  if (state.phase === 'success') return 'Tüm servisler hazır'
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
    return {
      tone: state.error.statusCode === 503 ? ('up' as const) : ('down' as const),
      value:
        state.error.statusCode === 503
          ? 'Yanıt veriyor'
          : isGatewayUnavailable
            ? 'Ulaşılamıyor'
            : 'Hata döndü',
      detail: isGatewayUnavailable
        ? 'Vite proxy Spring Boot API bağlantısını kuramadı.'
        : `HTTP ${state.error.statusCode ?? 'hatası'} alındı.`,
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
