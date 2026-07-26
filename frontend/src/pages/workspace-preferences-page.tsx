import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useUpdateWorkspaceSettings } from '@/api/workspace/queries'
import type { BackgroundMode, ThemeId } from '@/api/workspace/types'
import { applyThemePreferences, themes } from '@/app/theme'
import { useCurrentWorkspace } from '@/app/workspace-context'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function WorkspacePreferencesPage() {
  const workspace = useCurrentWorkspace()
  const updateSettings = useUpdateWorkspaceSettings()
  const [themeId, setThemeId] = useState<ThemeId>(workspace.themeId)
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(
    workspace.backgroundMode,
  )

  useEffect(() => {
    applyThemePreferences(themeId, backgroundMode)
  }, [backgroundMode, themeId])

  const save = async () => {
    await updateSettings.mutateAsync({
      timezone: workspace.timezone,
      themeId,
      backgroundMode,
      version: workspace.version,
    })
  }

  return (
    <div className="space-y-8">
      <section className="max-w-3xl pt-4 sm:pt-8">
        <p className="section-kicker">Görünüm tercihleri</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          ShiftARC’ın atmosferini seç.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          Tema ve saate duyarlı arka plan tercihi lokal çalışma alanında saklanır.
        </p>
      </section>

      <section className="rounded-3xl border border-border/75 bg-card/65 p-6 sm:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setThemeId(theme.id)}
              className={cn(
                'rounded-2xl border bg-background/35 p-5 text-left transition',
                theme.id === themeId
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border/80 hover:border-primary/35',
              )}
              aria-label={`${theme.name}: ${theme.description}`}
              aria-pressed={theme.id === themeId}
            >
              <span className="flex gap-2" aria-hidden="true">
                {theme.colors.map((color) => (
                  <span
                    key={color}
                    className="size-8 rounded-full border border-white/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </span>
              <span className="mt-5 block text-base font-semibold">{theme.name}</span>
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                {theme.description}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-border/70 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <label className="text-sm font-semibold">
            Arka plan davranışı
            <Select
              value={backgroundMode}
              onValueChange={(value) => setBackgroundMode(value as BackgroundMode)}
              options={[
                { value: 'TIME_AWARE', label: 'Saate göre değişsin' },
                { value: 'STATIC', label: 'Tema sabit kalsın' },
              ]}
              ariaLabel="Arka plan davranışı"
              className="min-w-60"
            />
          </label>
          <Button onClick={save} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Kaydediliyor…' : 'Tercihleri kaydet'}
            <Check className="size-4" aria-hidden="true" />
          </Button>
        </div>
        {updateSettings.error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {updateSettings.error.message}
          </p>
        ) : null}
        {updateSettings.isSuccess ? (
          <p className="mt-4 text-sm text-primary" role="status">
            Görünüm tercihleri kaydedildi.
          </p>
        ) : null}
      </section>
    </div>
  )
}
