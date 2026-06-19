import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { useWorkspace } from '@/api/workspace/queries'
import { applyThemePreferences, refreshDayPhase } from '@/app/theme'
import { WorkspaceProvider } from '@/app/workspace-context'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'

const OnboardingPage = lazy(() =>
  import('@/pages/onboarding-page').then((module) => ({
    default: module.OnboardingPage,
  })),
)

export function WorkspaceGate({ children }: { children: ReactNode }) {
  const workspaceQuery = useWorkspace()
  const workspace = workspaceQuery.data

  useEffect(() => {
    if (!workspace) return
    applyThemePreferences(workspace.themeId, workspace.backgroundMode)
    const interval = window.setInterval(refreshDayPhase, 60_000)
    return () => window.clearInterval(interval)
  }, [workspace])

  if (workspaceQuery.isPending) {
    return (
      <main className="app-canvas grid min-h-svh place-items-center px-5 text-foreground">
        <div className="text-center" role="status">
          <BrandMark className="mx-auto size-11" />
          <LoaderCircle className="mx-auto mt-6 size-5 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            Çalışma alanı yükleniyor…
          </p>
        </div>
      </main>
    )
  }

  if (workspaceQuery.isError || !workspace) {
    return (
      <main className="app-canvas grid min-h-svh place-items-center px-5 text-foreground">
        <section className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/80 p-7 text-center shadow-xl">
          <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Çalışma alanı yüklenemedi</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Backend veya PostgreSQL bağlantısını sistem ekranından kontrol edebilirsin.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => workspaceQuery.refetch()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Yeniden dene
            </Button>
            <Button asChild variant="outline">
              <Link to="/settings/system">Sistem durumunu aç</Link>
            </Button>
          </div>
        </section>
      </main>
    )
  }

  if (!workspace.onboardingCompleted) {
    return (
      <Suspense fallback={<WorkspaceLoadingState />}>
        <OnboardingPage workspace={workspace} />
      </Suspense>
    )
  }

  return <WorkspaceProvider workspace={workspace}>{children}</WorkspaceProvider>
}

function WorkspaceLoadingState() {
  return (
    <main className="app-canvas grid min-h-svh place-items-center px-5 text-foreground">
      <div className="text-center" role="status">
        <BrandMark className="mx-auto size-11" />
        <LoaderCircle className="mx-auto mt-6 size-5 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">Çalışma alanı hazırlanıyor…</p>
      </div>
    </main>
  )
}
