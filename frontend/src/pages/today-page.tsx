import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, Pencil, Play, RefreshCw, Settings2, SkipForward, Sparkles, Square, Timer, X, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useRegenerateTodayPlan, useTodayPlan } from '@/api/daily-plan/queries'
import type { DailyPlan, DailyPlanItem } from '@/api/daily-plan/types'
import { useExecutionState, useFinishExecution, useStartExecution, useTransitionExecution } from '@/api/execution/queries'
import type { ExecutionSession } from '@/api/execution/types'
import { useCompleteTrigger, useTriggers } from '@/api/triggers/queries'
import type { TriggerRule } from '@/api/triggers/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DailyPlanItemDialog } from '@/features/daily-plan/daily-plan-item-dialog'
import { formatTime } from '@/features/day-types/time'
import { ExecutionTimeDialog } from '@/features/execution/execution-time-dialog'

export function TodayPage() {
  const plan = useTodayPlan()
  const regenerate = useRegenerateTodayPlan()
  if (plan.isPending) return <div className="grid min-h-[70vh] place-items-center" role="status">Bugünün planı oluşturuluyor…</div>
  if (plan.isError || !plan.data) return <div className="grid min-h-[70vh] place-items-center text-center"><div><AlertTriangle className="mx-auto size-8 text-amber-400" /><h1 className="mt-4 text-xl font-semibold">Bugünün planı oluşturulamadı</h1><p className="mt-2 max-w-md text-sm text-muted-foreground">{plan.error?.message}</p><Button className="mt-5" variant="outline" onClick={() => plan.refetch()}>Yeniden dene</Button></div></div>
  return <TodayPlan plan={plan.data} onRegenerate={() => regenerate.mutate(plan.data.version)} regenerating={regenerate.isPending} />
}

function TodayPlan({ plan, onRegenerate, regenerating }: { plan: DailyPlan; onRegenerate: () => void; regenerating: boolean }) {
  const [now, setNow] = useState(() => new Date())
  const [correctingSession, setCorrectingSession] = useState<ExecutionSession | null>(null)
  const [adjustingItem, setAdjustingItem] = useState<{ item: DailyPlanItem; maxDurationMinutes: number } | null>(null)
  const [dismissedTriggerKeys, setDismissedTriggerKeys] = useState<Set<string>>(() => new Set())
  const notifiedTriggers = useRef<Set<string>>(new Set())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer) }, [])

  const time = zonedTime(now, plan.timezone)
  const minute = time.hour * 60 + time.minute + time.second / 60
  const currentBlock = plan.blocks.find((block) => minute >= block.startMinute && minute < block.endMinute)
  const currentItem = currentBlock?.items.find((item) => minute >= item.plannedStartMinute && minute < item.plannedEndMinute)
  const plannedMinutes = useMemo(() => plan.blocks.flatMap((block) => block.items).reduce((sum, item) => sum + item.plannedEndMinute - item.plannedStartMinute, 0), [plan.blocks])
  const execution = useExecutionState()
  const startExecution = useStartExecution()
  const finishExecution = useFinishExecution()
  const transitionExecution = useTransitionExecution()
  const triggers = useTriggers()
  const completeTrigger = useCompleteTrigger()
  const activeSession = execution.data?.activeSession
  const orderedItems = plan.blocks.flatMap((block) => block.items)
  const activeIndex = activeSession?.dailyPlanItemId ? orderedItems.findIndex((item) => item.id === activeSession.dailyPlanItemId) : -1
  const nextItem = orderedItems.find((item, index) => item.status === 'PLANNED' && index > activeIndex) ?? orderedItems.find((item) => item.status === 'PLANNED')
  const elapsedSeconds = activeSession ? Math.max(0, Math.floor((now.getTime() - new Date(activeSession.startedAt).getTime()) / 1000)) : 0
  const dueTriggers = useMemo(() => (triggers.data ?? []).filter((trigger) => isTriggerDueForDayType(trigger, plan.sourceDayTypeId)), [triggers.data, plan.sourceDayTypeId])
  const activeTrigger = dueTriggers.find((trigger) => !dismissedTriggerKeys.has(triggerKey(trigger))) ?? null
  const executionError = startExecution.error ?? finishExecution.error ?? transitionExecution.error
  const atmosphere = time.hour < 6 ? 'from-indigo-950/45 via-background to-background' : time.hour < 12 ? 'from-amber-400/12 via-background to-background' : time.hour < 18 ? 'from-emerald-400/10 via-background to-background' : 'from-violet-500/15 via-background to-background'

  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    dueTriggers.forEach((trigger) => {
      const key = triggerKey(trigger)
      if (notifiedTriggers.current.has(key)) return
      new Notification(`ShiftARC · ${trigger.title}`, { body: `${trigger.durationMinutes} dakikalık trigger zamanı.` })
      notifiedTriggers.current.add(key)
    })
  }, [dueTriggers])

  return <div className={`-mx-5 -mt-8 min-h-[calc(100svh-4.5rem)] bg-gradient-to-b ${atmosphere} px-5 pt-10 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10`}>
    <section className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="section-kicker">{new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: plan.timezone }).format(now)}</p><div className="mt-3 flex items-baseline font-mono tracking-[-0.08em]"><span className="text-7xl font-semibold sm:text-9xl">{pad(time.hour)}:{pad(time.minute)}</span><span className="ml-3 text-2xl text-primary sm:text-4xl">{pad(time.second)}</span></div><p className="mt-3 text-sm text-muted-foreground">{plan.sourceDayTypeName} · {plan.timezone}</p></div>
      <div className="flex flex-wrap items-center gap-3"><div className="rounded-2xl border bg-card/55 px-4 py-3"><p className="text-xs text-muted-foreground">Planlanan görev süresi</p><p className="mt-1 font-semibold">{Math.floor(plannedMinutes / 60)} sa {plannedMinutes % 60} dk</p></div><Button variant="outline" onClick={onRegenerate} disabled={regenerating || Boolean(activeSession)}><RefreshCw className={`size-4 ${regenerating ? 'animate-spin' : ''}`} />Yenile</Button></div>
    </section>

    <section className="mt-10 rounded-3xl border border-border/70 bg-card/45 p-5 sm:p-6">
      <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Şu anda</p><h1 className="mt-2 text-2xl font-semibold">{currentItem?.taskTitle ?? currentBlock?.name ?? 'Gün tamamlandı'}</h1>{currentItem?.taskStageTitle ? <p className="mt-1 text-sm text-primary">{currentItem.taskStageTitle}</p> : null}<p className="mt-1 text-sm text-muted-foreground">{currentItem ? `${formatTime(currentItem.plannedStartMinute)}–${formatTime(currentItem.plannedEndMinute)} · ${currentBlock?.name}` : currentBlock ? `${formatTime(currentBlock.startMinute)}–${formatTime(currentBlock.endMinute)}` : ''}</p></div><div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">{currentItem ? <Timer className="size-5" /> : <CalendarDays className="size-5" />}</div></div>
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
        {activeSession ? <><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Aktif çalışma</p><p className="mt-1 font-semibold">{activeSession.taskTitle}</p><p className="mt-1 font-mono text-sm text-muted-foreground">{duration(elapsedSeconds)}</p></div><div className="flex gap-2"><Button variant="outline" disabled={finishExecution.isPending} onClick={() => finishExecution.mutate({ sessionId: activeSession.id, version: activeSession.version })}><Square className="size-4" />Bitir</Button>{nextItem ? <Button disabled={transitionExecution.isPending} onClick={() => transitionExecution.mutate({ sessionId: activeSession.id, nextDailyPlanItemId: nextItem.id, version: activeSession.version })}><SkipForward className="size-4" />Sıradaki görev</Button> : null}</div></> : <><div><p className="font-semibold">{nextItem ? `Sırada: ${nextItem.taskTitle}` : 'Planlanan görevler tamamlandı'}</p>{nextItem?.taskStageTitle ? <p className="mt-1 text-sm text-primary">{nextItem.taskStageTitle}</p> : null}<p className="mt-1 text-xs text-muted-foreground">Başlangıç saati gerçek yürütme geçmişine kaydedilir.</p></div>{nextItem ? <Button disabled={startExecution.isPending} onClick={() => startExecution.mutate(nextItem.id)}><Play className="size-4" />{startExecution.isPending ? 'Başlatılıyor…' : 'Görevi başlat'}</Button> : <CheckCircle2 className="size-6 text-primary" />}</>}
      </div>
      {executionError ? <p role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{executionError.message}</p> : null}
      <Timeline plan={plan} minute={minute} />
    </section>

    <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-3 sm:grid-cols-2">{plan.blocks.flatMap((block) => block.items.map((item) => <article key={item.id} className="rounded-2xl border border-border/70 bg-card/45 p-4"><div className="flex items-start justify-between"><span className="text-xs text-muted-foreground">{formatTime(item.plannedStartMinute)}–{formatTime(item.plannedEndMinute)}</span><span className="text-amber-400">{'★'.repeat(item.importance)}</span></div><div className="mt-2 flex items-start justify-between gap-2"><div><h2 className="font-semibold">{item.taskTitle}</h2>{item.taskStageTitle ? <p className="mt-1 text-sm text-primary">{item.taskStageTitle}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{block.name} · {taskTypeLabel(item.taskType)}</p></div>{item.status === 'PLANNED' ? <Button size="sm" variant="ghost" aria-label={`${item.taskTitle} günlük planını ayarla`} onClick={() => setAdjustingItem({ item, maxDurationMinutes: maximumDuration(block, item) })}><Settings2 className="size-3.5" /></Button> : null}</div></article>))}</div>
      <div className="space-y-4"><aside className="rounded-2xl border border-border/70 bg-card/45 p-5"><p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" />Plan notları</p>{plan.warnings.length ? <div className="mt-4 space-y-3">{plan.warnings.map((warning) => <p key={`${warning.taskId}-${warning.reasonCode}`} className="rounded-xl bg-amber-400/8 p-3 text-xs leading-5 text-amber-200">{warning.detail} ({warning.unallocatedMinutes} dk)</p>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Bütün günlük süre istekleri uygun bloklara yerleştirildi.</p>}</aside><aside className="rounded-2xl border border-border/70 bg-card/45 p-5"><p className="flex items-center gap-2 font-semibold"><Clock3 className="size-4 text-primary" />Bugünün gerçekleşenleri</p><div className="mt-4 space-y-2">{execution.data?.sessions.filter((session) => session.endedAt).map((session) => <div key={session.id} className="flex items-center justify-between gap-2 rounded-xl bg-background/35 p-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{session.taskTitle}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{duration(session.durationSeconds)}</p></div><Button size="sm" variant="ghost" aria-label={`${session.taskTitle} zamanını düzelt`} onClick={() => setCorrectingSession(session)}><Pencil className="size-3.5" /></Button></div>)}{!execution.data?.sessions.some((session) => session.endedAt) ? <p className="text-xs text-muted-foreground">Henüz tamamlanan oturum yok.</p> : null}</div></aside></div>
    </section>

    {correctingSession ? <ExecutionTimeDialog key={`${correctingSession.id}-${correctingSession.version}`} session={correctingSession} open onOpenChange={(open) => { if (!open) setCorrectingSession(null) }} /> : null}
    {adjustingItem ? <DailyPlanItemDialog key={`${adjustingItem.item.id}-${adjustingItem.item.version}`} item={adjustingItem.item} maxDurationMinutes={adjustingItem.maxDurationMinutes} open onOpenChange={(open) => { if (!open) setAdjustingItem(null) }} /> : null}
    {activeTrigger ? <TriggerDueDialog trigger={activeTrigger} completing={completeTrigger.isPending} onComplete={() => completeTrigger.mutate({ id: activeTrigger.id, version: activeTrigger.version }, { onSuccess: () => setDismissedTriggerKeys((current) => new Set(current).add(triggerKey(activeTrigger))) })} onClose={() => setDismissedTriggerKeys((current) => new Set(current).add(triggerKey(activeTrigger)))} /> : null}
  </div>
}

function Timeline({ plan, minute }: { plan: DailyPlan; minute: number }) {
  return <div className="mt-7 overflow-x-auto pb-2"><div className="relative flex h-40 min-w-[800px] overflow-hidden rounded-2xl border bg-background/40">{plan.blocks.map((block) => <div key={block.id} className="relative border-r border-border/50 last:border-0" style={{ width: `${((block.endMinute - block.startMinute) / 1440) * 100}%` }}><div className="absolute inset-0 bg-primary/8" /><p className="relative z-10 truncate p-2 text-[10px] font-semibold text-muted-foreground">{block.name}</p>{block.items.map((item) => <div key={item.id} className={`absolute top-8 bottom-2 rounded-lg border px-2 py-2 text-[10px] font-semibold ${item.status === 'COMPLETED' ? 'bg-emerald-500/55 text-white' : item.status === 'ACTIVE' ? 'animate-pulse text-foreground' : 'text-foreground'}`} style={{ left: `${((item.plannedStartMinute - block.startMinute) / (block.endMinute - block.startMinute)) * 100}%`, width: `${((item.plannedEndMinute - item.plannedStartMinute) / (block.endMinute - block.startMinute)) * 100}%`, ...itemTone(item.taskId, item.status) }} title={`${item.taskTitle} · ${formatTime(item.plannedStartMinute)}–${formatTime(item.plannedEndMinute)}`}><span className="line-clamp-2">{item.taskTitle}</span>{item.taskStageTitle ? <span className="mt-1 block truncate text-[9px] opacity-80">{item.taskStageTitle}</span> : null}</div>)}</div>)}<div className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]" style={{ left: `${Math.max(0, Math.min(100, (minute / 1440) * 100))}%` }} aria-label="Şu an göstergesi" /></div></div>
}

function zonedTime(date: Date, timezone: string) { const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date); const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0); return { hour: value('hour'), minute: value('minute'), second: value('second') } }
function pad(value: number) { return String(value).padStart(2, '0') }
function duration(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const rest = seconds % 60; return `${pad(hours)}:${pad(minutes)}:${pad(rest)}` }
function maximumDuration(block: DailyPlan['blocks'][number], selected: DailyPlanItem) { const planned = block.items.filter((item) => item.status === 'PLANNED'); const first = planned[0]?.plannedStartMinute ?? selected.plannedStartMinute; const otherMinutes = planned.filter((item) => item.id !== selected.id).reduce((sum, item) => sum + item.plannedEndMinute - item.plannedStartMinute, 0); return Math.max(5, block.endMinute - first - otherMinutes) }
function taskTypeLabel(type: DailyPlanItem['taskType']) { return type === 'WORK_ITEM' ? 'İş parçacığı' : type === 'HABIT' ? 'Alışkanlık' : 'Fırsat' }
function itemTone(id: string, status: DailyPlanItem['status']) { const tones = ['--primary', '--ring', '--ambient-one', '--ambient-two']; const index = Math.abs([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % tones.length; const token = tones[index]; return { backgroundColor: status === 'COMPLETED' ? undefined : `color-mix(in srgb, var(${token}) 36%, transparent)`, borderColor: `color-mix(in srgb, var(${token}) 54%, var(--border))` } }
function isTriggerDueForDayType(trigger: TriggerRule, dayTypeId: string) { return trigger.status === 'ACTIVE' && Boolean(trigger.nextDueAt) && new Date(trigger.nextDueAt as string) <= new Date() && (!trigger.dayTypes.length || trigger.dayTypes.some((dayType) => dayType.id === dayTypeId)) }
function triggerKey(trigger: TriggerRule) { return `${trigger.id}:${trigger.nextDueAt ?? 'manual'}` }

function TriggerDueDialog({ trigger, completing, onComplete, onClose }: { trigger: TriggerRule; completing: boolean; onComplete: () => void; onClose: () => void }) {
  return <Dialog open onOpenChange={() => undefined}>
    <DialogContent className="overflow-hidden border-amber-300/40 bg-background/95 backdrop-blur-2xl sm:max-w-lg">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_50%_0%,rgba(251,191,36,.24),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-32 animate-pulse bg-[linear-gradient(115deg,transparent_0_44%,rgba(251,191,36,.75)_45%,transparent_48%,transparent_58%,rgba(167,139,250,.6)_60%,transparent_63%)] blur-sm" />
      <button type="button" className="absolute top-4 right-4 z-10 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Trigger uyarısını kapat" onClick={onClose}><X className="size-4" /></button>
      <DialogHeader className="relative">
        <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-amber-300/15 text-amber-200"><Zap className="size-6" /></div>
        <DialogTitle>Trigger zamanı</DialogTitle>
        <DialogDescription>{trigger.title} · {trigger.durationMinutes} dakika</DialogDescription>
      </DialogHeader>
      <div className="relative mt-3 rounded-2xl border border-amber-300/20 bg-card/50 p-4 text-sm text-muted-foreground">Bu uyarı sen kapat ikonuna basana kadar açık kalır. İstersen eylemi tamamlandı olarak da işaretleyebilirsin.</div>
      <div className="relative mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Sadece kapat</Button><Button disabled={completing} onClick={onComplete}>Yaptım</Button></div>
    </DialogContent>
  </Dialog>
}
