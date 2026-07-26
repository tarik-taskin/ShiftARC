import { Check, Coffee, Play, Settings2, Square, Target } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useFinishPomodoro, usePomodoro, useStartPomodoro, useUpdatePomodoroSettings } from '@/api/pomodoro/queries'
import type { PomodoroPhase } from '@/api/pomodoro/types'
import { useTasks } from '@/api/tasks/queries'
import { Button } from '@/components/ui/button'
import { NumberStepper } from '@/components/ui/number-stepper'
import { Select } from '@/components/ui/select'

export function FocusPage() {
  const pomodoro = usePomodoro(); const start = useStartPomodoro(); const finish = useFinishPomodoro(); const update = useUpdatePomodoroSettings()
  const tasks = useTasks({ status: 'ACTIVE', sort: 'PRIORITY' }); const [taskId, setTaskId] = useState(''); const [now, setNow] = useState<number | null>(null); const autoFinished = useRef<string | null>(null)
  const active = pomodoro.data?.activeSession
  const remaining = useMemo(() => active ? now === null ? active.durationMinutes * 60 : Math.max(0, Math.ceil((new Date(active.plannedEndAt).getTime() - now) / 1000)) : 0, [active, now])
  useEffect(() => { if (!active) return; const timer = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(timer) }, [active])
  useEffect(() => { if (active && remaining === 0 && autoFinished.current !== active.id) { autoFinished.current = active.id; finish.mutate({ sessionId: active.id, version: active.version }) } }, [active, finish, remaining])
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0'); const seconds = String(remaining % 60).padStart(2, '0')
  const settings = pomodoro.data?.settings

  function begin(phase: PomodoroPhase) { start.mutate({ phase, taskId: phase === 'FOCUS' && taskId ? taskId : null }) }

  return <div className="space-y-8 pt-4 sm:pt-8"><section><p className="section-kicker">Dikkati koru</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Odak sayacı</h1><p className="mt-4 max-w-2xl text-muted-foreground">Odak ve mola oturumları sunucuda saklanır; sayfayı kapatsan da sayaç kaldığı yerden görünür.</p></section>
    <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="grid min-h-[430px] place-items-center rounded-[2rem] border bg-card/55 p-6 text-center"><div>{active ? <><div className={`mx-auto grid size-64 place-items-center rounded-full border-[10px] ${active.phase === 'FOCUS' ? 'border-primary/30 bg-primary/5' : 'border-sky-400/30 bg-sky-400/5'}`}><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-muted-foreground">{label(active.phase)}</p><p className="mt-3 font-mono text-6xl font-semibold tracking-[-.08em]">{minutes}:{seconds}</p><p className="mt-3 text-sm text-muted-foreground">{active.taskTitle ?? 'Serbest oturum'}</p></div></div><div className="mt-7 flex justify-center gap-3"><Button variant="outline" onClick={() => finish.mutate({ sessionId: active.id, version: active.version, cancelled: true })}><Square className="size-4" />İptal et</Button><Button onClick={() => finish.mutate({ sessionId: active.id, version: active.version })}><Check className="size-4" />Tamamla</Button></div></> : <><Target className="mx-auto size-12 text-primary" /><h2 className="mt-5 text-2xl font-semibold">Bir ritim seç</h2><label className="mx-auto mt-6 block max-w-sm text-left text-sm">Odak görevi<Select value={taskId} onValueChange={setTaskId} ariaLabel="Odak görevi" options={[{ value: '', label: 'Serbest odak' }, ...(tasks.data?.map((task) => ({ value: task.id, label: task.title })) ?? [])]} /></label><div className="mt-5 flex flex-wrap justify-center gap-2"><Button onClick={() => begin('FOCUS')}><Play className="size-4" />{settings?.focusMinutes ?? 25} dk odak</Button><Button variant="outline" onClick={() => begin('SHORT_BREAK')}><Coffee className="size-4" />Kısa mola</Button><Button variant="outline" onClick={() => begin('LONG_BREAK')}><Coffee className="size-4" />Uzun mola</Button></div></>}</div></div>
      <aside className="space-y-4"><div className="rounded-3xl border bg-card/55 p-5"><p className="text-sm text-muted-foreground">Bugünkü odak döngüsü</p><p className="mt-2 text-4xl font-semibold">{pomodoro.data?.focusCyclesToday ?? 0}</p><p className="mt-2 text-xs text-muted-foreground">{settings?.cyclesBeforeLongBreak ?? 4} döngüden sonra uzun mola önerilir.</p></div>{settings ? <SettingsForm settings={settings} pending={update.isPending} onSave={(value) => update.mutate(value)} /> : null}</aside></section>
    <section><h2 className="text-lg font-semibold">Son oturumlar</h2><div className="mt-3 grid gap-2">{pomodoro.data?.recentSessions.filter((s) => s.status !== 'ACTIVE').slice(0, 5).map((s) => <div key={s.id} className="flex items-center justify-between rounded-2xl border bg-card/40 px-4 py-3"><span>{label(s.phase)}{s.taskTitle ? ` · ${s.taskTitle}` : ''}</span><span className="text-sm text-muted-foreground">{s.durationMinutes} dk · {s.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal'}</span></div>)}</div></section>
  </div>
}

function SettingsForm({ settings, pending, onSave }: { settings: { focusMinutes: number; shortBreakMinutes: number; longBreakMinutes: number; cyclesBeforeLongBreak: number; version: number }; pending: boolean; onSave: (value: typeof settings) => void }) {
  const [value, setValue] = useState(settings)
  return <form onSubmit={(e) => { e.preventDefault(); onSave(value) }} className="rounded-3xl border bg-card/55 p-5"><p className="flex items-center gap-2 font-semibold"><Settings2 className="size-4" />Sayaç ayarları</p>{(['focusMinutes', 'shortBreakMinutes', 'longBreakMinutes', 'cyclesBeforeLongBreak'] as const).map((key) => <label key={key} className="mt-3 block text-sm"><span>{({ focusMinutes: 'Odak', shortBreakMinutes: 'Kısa mola', longBreakMinutes: 'Uzun mola', cyclesBeforeLongBreak: 'Uzun mola döngüsü' })[key]}</span><NumberStepper value={value[key]} min={key === 'cyclesBeforeLongBreak' ? 2 : 1} onChange={(next) => setValue({ ...value, [key]: next })} ariaLabel={({ focusMinutes: 'Odak', shortBreakMinutes: 'Kısa mola', longBreakMinutes: 'Uzun mola', cyclesBeforeLongBreak: 'Uzun mola döngüsü' })[key]} /></label>)}<Button className="mt-5 w-full" size="sm" variant="outline" disabled={pending}>Ayarları kaydet</Button></form>
}

function label(phase: PomodoroPhase) { return phase === 'FOCUS' ? 'Odak' : phase === 'SHORT_BREAK' ? 'Kısa mola' : 'Uzun mola' }
