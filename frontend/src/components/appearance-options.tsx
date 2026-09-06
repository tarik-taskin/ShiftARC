import type { ClockStyle, ColorMode, ThemeId } from '@/api/workspace/types'
import { themes } from '@/app/theme'
import { Clock } from './clock'
import { cn } from '@/lib/utils'

export interface AppearanceValue { themeId: ThemeId; colorMode: ColorMode; clockStyle: ClockStyle }
const clockOptions: { id: ClockStyle; name: string }[] = [{ id: 'DIGITAL', name: 'Sade dijital' }, { id: 'DIAL', name: 'Tipografik kadran' }, { id: 'SEGMENT', name: 'Segmentli' }]
const previewTime = new Date('2026-09-06T07:24:18Z')
export function AppearanceOptions({ value, onChange }: { value: AppearanceValue; onChange: (value: AppearanceValue) => void }) {
  return <div className="space-y-6">
    <fieldset><legend className="mb-3 text-sm font-semibold">Renk teması</legend><div className="grid gap-3 md:grid-cols-3">{themes.map((theme) => <button key={theme.id} type="button" aria-label={theme.name + ': ' + theme.description} aria-pressed={value.themeId === theme.id} onClick={() => onChange({ ...value, themeId: theme.id })} className={cn('min-w-0 overflow-hidden rounded-xl border text-left', value.themeId === theme.id ? 'border-primary ring-2 ring-primary/20' : 'border-border')}>
      <span data-theme={theme.id} data-color-mode={value.colorMode} className="block border-b bg-background p-3" aria-hidden="true"><span className="flex gap-2"><span className="w-7 rounded bg-secondary" /><span className="min-w-0 flex-1"><span className="mb-2 flex justify-between text-xs font-semibold"><span>Bugün</span><span>10:24</span></span><span className="flex h-5 gap-1"><span className="w-1/5 rounded bg-muted" /><span className="w-3/5 rounded bg-primary/25" /><span className="flex-1 rounded bg-muted" /></span><span className="mt-2 block rounded border bg-card p-2 text-xs">Okuma · 30 dk</span></span></span></span>
      <span className="block px-3 py-3"><span className="block font-semibold">{theme.name}</span><span className="mt-1 block text-xs text-muted-foreground">{theme.description}</span><span className="mt-3 flex gap-1.5" aria-hidden="true">{theme.colors.map((color) => <span key={color} className="size-4 rounded-full border" style={{ background: color }} />)}</span></span>
    </button>)}</div></fieldset>
    <fieldset><legend className="mb-3 text-sm font-semibold">Açık / koyu görünüm</legend><div className="flex gap-2">{(['LIGHT', 'DARK'] as const).map((mode) => <button key={mode} type="button" aria-pressed={value.colorMode === mode} onClick={() => onChange({ ...value, colorMode: mode })} className={cn('min-h-11 rounded-lg border px-5 text-sm', value.colorMode === mode ? 'border-primary bg-accent text-primary' : 'bg-card')}>{mode === 'LIGHT' ? 'Açık' : 'Koyu'}</button>)}</div></fieldset>
    <fieldset><legend className="mb-3 text-sm font-semibold">Saat tasarımı</legend><div className="grid gap-3 sm:grid-cols-3">{clockOptions.map((clock) => <button type="button" key={clock.id} aria-pressed={value.clockStyle === clock.id} aria-label={clock.name} onClick={() => onChange({ ...value, clockStyle: clock.id })} className={cn('min-w-0 rounded-xl border bg-card p-3', value.clockStyle === clock.id && 'border-primary ring-2 ring-primary/20')}><span className="grid h-20 place-items-center"><Clock now={previewTime} timezone="Europe/Istanbul" style={clock.id} compact /></span><span className="mt-2 block text-xs font-medium">{clock.name}</span></button>)}</div></fieldset>
  </div>
}
