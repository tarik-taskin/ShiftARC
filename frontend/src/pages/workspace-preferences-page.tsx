import { useEffect, useRef, useState } from 'react'
import { useUpdateWorkspaceSettings } from '@/api/workspace/queries'
import { applyThemePreferences } from '@/app/theme'
import { useCurrentWorkspace } from '@/app/workspace-context'
import { AppearanceOptions, type AppearanceValue } from '@/components/appearance-options'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { PageHeader, Section } from '@/components/ui/page'
import type { BackgroundMode } from '@/api/workspace/types'

export function WorkspacePreferencesPage() {
  const workspace = useCurrentWorkspace()
  const update = useUpdateWorkspaceSettings()
  const [value, setValue] = useState<AppearanceValue>({ themeId: workspace.themeId, colorMode: workspace.colorMode, clockStyle: workspace.clockStyle })
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(workspace.backgroundMode)
  const saved = useRef(workspace)
  useEffect(() => { saved.current = workspace }, [workspace])
  useEffect(() => {
    applyThemePreferences(value.themeId, backgroundMode, value.colorMode, workspace.timezone)
  }, [value.themeId, value.colorMode, backgroundMode, workspace.timezone])
  useEffect(() => () => {
    const current = saved.current
    applyThemePreferences(current.themeId, current.backgroundMode, current.colorMode, current.timezone)
  }, [])
  const save = async () => {
    try {
      const result = await update.mutateAsync({ ...value, backgroundMode, timezone: workspace.timezone, version: workspace.version })
      saved.current = result
    } catch { /* The mutation error is displayed below; keep the preview editable. */ }
  }
  return <div className="space-y-6"><PageHeader title="Görünüm" description="Renklerini ve saatini seç. Değişiklikleri kaydetmeden önce burada deneyebilirsin." />
    <Section><AppearanceOptions value={value} onChange={setValue} />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t pt-5"><label className="text-sm font-medium">Arka plan davranışı<Select value={backgroundMode} onValueChange={(mode) => setBackgroundMode(mode as BackgroundMode)} ariaLabel="Arka plan davranışı" options={[{ value: 'STATIC', label: 'Tema sabit kalsın' }, { value: 'TIME_AWARE', label: 'Saate göre değişsin' }]} /></label><Button onClick={() => void save()} disabled={update.isPending}>{update.isPending ? 'Kaydediliyor…' : 'Tercihleri kaydet'}</Button></div>
      {update.error ? <p role="alert" className="mt-4 text-sm text-destructive">{update.error.message}</p> : null}
      {update.isSuccess ? <p role="status" className="mt-4 text-sm text-success">Görünüm tercihleri kaydedildi.</p> : null}
    </Section></div>
}
