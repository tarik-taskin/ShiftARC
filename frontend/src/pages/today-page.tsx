import { CheckCircle2, Clock3, Pencil, Play, RefreshCw, Settings2, SkipForward, Sparkles, Square, X, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useRegenerateTodayPlan, useTodayPlan } from '@/api/daily-plan/queries'
import type { DailyPlan, DailyPlanItem } from '@/api/daily-plan/types'
import { useExecutionState, useFinishExecution, useStartExecution, useTransitionExecution } from '@/api/execution/queries'
import type { ExecutionSession } from '@/api/execution/types'
import { useCompleteTrigger, useTriggers } from '@/api/triggers/queries'
import type { TriggerRule } from '@/api/triggers/types'
import { AdaptiveTimeline } from '@/features/daily-plan/adaptive-timeline'
import { workspaceDate, workspaceTime } from '@/features/daily-plan/time-scale'
import { Clock } from '@/components/clock'
import { useOptionalWorkspace } from '@/app/workspace-context'
import { ErrorState } from '@/components/ui/page'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DailyPlanItemDialog } from '@/features/daily-plan/daily-plan-item-dialog'
import { formatTime } from '@/features/day-types/time'
import { ExecutionTimeDialog } from '@/features/execution/execution-time-dialog'

export function TodayPage() {
  const plan = useTodayPlan()
  const regenerate = useRegenerateTodayPlan()
  const timezone = plan.data?.timezone
  const refetch = plan.refetch
  useEffect(() => {
    if (!timezone) return
    let date = workspaceDate(new Date(), timezone)
    const timer = window.setInterval(() => {
      const next = workspaceDate(new Date(), timezone)
      if (next !== date) { date = next; void refetch() }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [timezone, refetch])
  if (plan.isPending) return <div className="grid min-h-[70vh] place-items-center" role="status">Bugünün planı oluşturuluyor…</div>
  if (plan.isError || !plan.data) return <ErrorState title="Bugünün planı oluşturulamadı" detail={plan.error?.message} retry={() => plan.refetch()} />
  return <><TodayPlan key={plan.data.id} plan={plan.data} onRegenerate={() => regenerate.mutate(plan.data.version)} regenerating={regenerate.isPending} />{regenerate.error ? <ErrorState title="Plan yenilenemedi" detail={regenerate.error.message} retry={() => regenerate.mutate(plan.data.version)} /> : null}</>

}

function TodayPlan({ plan, onRegenerate, regenerating }: { plan: DailyPlan; onRegenerate: () => void; regenerating: boolean }) {
  const workspace = useOptionalWorkspace()
  const [now, setNow] = useState(() => new Date())
  const [correctingSession, setCorrectingSession] = useState<ExecutionSession | null>(null)
  const [adjustingItem, setAdjustingItem] = useState<{ item: DailyPlanItem; maxDurationMinutes: number } | null>(null)
  const [dismissedTriggerKeys, setDismissedTriggerKeys] = useState<Set<string>>(() => new Set())
  const notifiedTriggers = useRef<Set<string>>(new Set())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer) }, [])

  const time = workspaceTime(now, plan.timezone)
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


  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    dueTriggers.forEach((trigger) => {
      const key = triggerKey(trigger)
      if (notifiedTriggers.current.has(key)) return
      new Notification(`ShiftARC · ${trigger.title}`, { body: `${trigger.durationMinutes} dakikalık trigger zamanı.` })
      notifiedTriggers.current.add(key)
    })
  }, [dueTriggers])

  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: plan.timezone }).format(now)}</p><h1 className="mt-1 text-[28px] font-semibold">Bugün</h1><p className="mt-1 text-sm text-muted-foreground">{plan.sourceDayTypeName} · {plan.timezone}</p></div>
      <div className="text-right"><Clock now={now} timezone={plan.timezone} style={workspace?.clockStyle} /><p className="mt-1 text-xs text-muted-foreground">{Math.floor(plannedMinutes / 60)} sa {plannedMinutes % 60} dk planlandı</p></div>
    </header>
    <AdaptiveTimeline plan={plan} minute={minute} frozen={Boolean(adjustingItem || correctingSession || activeTrigger)} />
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Şu an planda: <span className="font-medium text-foreground">{currentItem?.taskTitle ?? currentBlock?.name ?? 'Gün tamamlandı'}</span></p>{currentBlock ? <span className="font-mono text-xs text-muted-foreground">{formatTime(currentBlock.startMinute)}–{formatTime(currentBlock.endMinute)}</span> : null}</div>
      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-primary/15 bg-primary/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
        {activeSession ? <><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Aktif çalışma</p><p className="mt-1 font-semibold">{activeSession.taskTitle}</p><p className="mt-1 font-mono text-sm text-muted-foreground">{duration(elapsedSeconds)}</p></div><div className="flex gap-2"><Button variant="outline" disabled={finishExecution.isPending} onClick={() => finishExecution.mutate({ sessionId: activeSession.id, version: activeSession.version })}><Square className="size-4" />Bitir</Button>{nextItem ? <Button disabled={transitionExecution.isPending} onClick={() => transitionExecution.mutate({ sessionId: activeSession.id, nextDailyPlanItemId: nextItem.id, version: activeSession.version })}><SkipForward className="size-4" />Sıradaki görev</Button> : null}</div></> : <><div><p className="font-semibold">{nextItem ? `Sırada: ${nextItem.taskTitle}` : 'Planlanan görevler tamamlandı'}</p>{nextItem?.taskStageTitle ? <p className="mt-1 text-sm text-primary">{nextItem.taskStageTitle}</p> : null}<p className="mt-1 text-xs text-muted-foreground">Başlangıç saati gerçek yürütme geçmişine kaydedilir.</p></div>{nextItem ? <Button disabled={startExecution.isPending} onClick={() => startExecution.mutate(nextItem.id)}><Play className="size-4" />{startExecution.isPending ? 'Başlatılıyor…' : 'Görevi başlat'}</Button> : <CheckCircle2 className="size-6 text-primary" />}</>}
      </div>
      {executionError ? <p role="alert" className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{executionError.message}</p> : null}

    </section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-2"><div className="flex items-center justify-between gap-2 pb-2"><h2 className="font-semibold">Görev kuyruğu</h2><Button size="sm" variant="outline" onClick={onRegenerate} disabled={regenerating || Boolean(activeSession)}><RefreshCw className="size-4" />Yenile</Button></div>{plan.blocks.flatMap((block) => block.items.map((item) => <article key={item.id} className="rounded-lg border border-border/70 bg-card p-4"><div className="flex items-start justify-between"><span className="text-xs text-muted-foreground">{formatTime(item.plannedStartMinute)}–{formatTime(item.plannedEndMinute)}</span><span className="text-warning">{'★'.repeat(item.importance)}</span></div><div className="mt-2 flex items-start justify-between gap-2"><div><h2 className="font-semibold">{item.taskTitle}</h2>{item.taskStageTitle ? <p className="mt-1 text-sm text-primary">{item.taskStageTitle}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{block.name} · {taskTypeLabel(item.taskType)}</p></div>{item.status === 'PLANNED' ? <Button size="sm" variant="ghost" aria-label={`${item.taskTitle} günlük planını ayarla`} onClick={() => setAdjustingItem({ item, maxDurationMinutes: maximumDuration(block, item) })}><Settings2 className="size-3.5" /></Button> : null}</div></article>))}</div>
      <div className="space-y-4"><aside className="rounded-lg border border-border/70 bg-card p-5"><p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" />Plan notları</p>{plan.warnings.length ? <div className="mt-4 space-y-3">{plan.warnings.map((warning) => <p key={`${warning.taskId}-${warning.reasonCode}`} className="rounded-xl bg-warning/10 p-3 text-xs leading-5 text-warning">{warning.detail} ({warning.unallocatedMinutes} dk)</p>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Bütün günlük süre istekleri uygun bloklara yerleştirildi.</p>}</aside><aside className="rounded-lg border border-border/70 bg-card p-5"><p className="flex items-center gap-2 font-semibold"><Clock3 className="size-4 text-primary" />Bugünün gerçekleşenleri</p><div className="mt-4 space-y-2">{execution.data?.sessions.filter((session) => session.endedAt).map((session) => <div key={session.id} className="flex items-center justify-between gap-2 rounded-xl bg-background/35 p-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{session.taskTitle}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{duration(session.durationSeconds)}</p></div><Button size="sm" variant="ghost" aria-label={`${session.taskTitle} zamanını düzelt`} onClick={() => setCorrectingSession(session)}><Pencil className="size-3.5" /></Button></div>)}{!execution.data?.sessions.some((session) => session.endedAt) ? <p className="text-xs text-muted-foreground">Henüz tamamlanan oturum yok.</p> : null}</div></aside></div>
    </section>

    {correctingSession ? <ExecutionTimeDialog key={`${correctingSession.id}-${correctingSession.version}`} session={correctingSession} open onOpenChange={(open) => { if (!open) setCorrectingSession(null) }} /> : null}
    {adjustingItem ? <DailyPlanItemDialog key={`${adjustingItem.item.id}-${adjustingItem.item.version}`} item={adjustingItem.item} maxDurationMinutes={adjustingItem.maxDurationMinutes} open onOpenChange={(open) => { if (!open) setAdjustingItem(null) }} /> : null}
    {activeTrigger ? <TriggerDueDialog trigger={activeTrigger} completing={completeTrigger.isPending} onComplete={() => completeTrigger.mutate({ id: activeTrigger.id, version: activeTrigger.version }, { onSuccess: () => setDismissedTriggerKeys((current) => new Set(current).add(triggerKey(activeTrigger))) })} onClose={() => setDismissedTriggerKeys((current) => new Set(current).add(triggerKey(activeTrigger)))} /> : null}
  </div>
}

function pad(value: number) { return String(value).padStart(2, '0') }
function duration(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const rest = seconds % 60; return `${pad(hours)}:${pad(minutes)}:${pad(rest)}` }
function maximumDuration(block: DailyPlan['blocks'][number], selected: DailyPlanItem) { const planned = block.items.filter((item) => item.status === 'PLANNED'); const first = planned[0]?.plannedStartMinute ?? selected.plannedStartMinute; const otherMinutes = planned.filter((item) => item.id !== selected.id).reduce((sum, item) => sum + item.plannedEndMinute - item.plannedStartMinute, 0); return Math.max(5, block.endMinute - first - otherMinutes) }
function taskTypeLabel(type: DailyPlanItem['taskType']) { return type === 'WORK_ITEM' ? 'İş parçacığı' : type === 'HABIT' ? 'Alışkanlık' : 'Fırsat' }
function isTriggerDueForDayType(trigger: TriggerRule, dayTypeId: string) { return trigger.status === 'ACTIVE' && Boolean(trigger.nextDueAt) && new Date(trigger.nextDueAt as string) <= new Date() && (!trigger.dayTypes.length || trigger.dayTypes.some((dayType) => dayType.id === dayTypeId)) }
function triggerKey(trigger: TriggerRule) { return `${trigger.id}:${trigger.nextDueAt ?? 'manual'}` }

function TriggerDueDialog({ trigger, completing, onComplete, onClose }: { trigger: TriggerRule; completing: boolean; onComplete: () => void; onClose: () => void }) {
  return <Dialog open onOpenChange={() => undefined}>
    <DialogContent className="overflow-hidden border-warning/30 bg-card sm:max-w-lg">
      <button type="button" className="absolute top-4 right-4 z-10 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Trigger uyarısını kapat" onClick={onClose}><X className="size-4" /></button>
      <DialogHeader className="relative">
        <div className="mb-3 grid size-12 place-items-center rounded-lg bg-warning/10 text-warning"><Zap className="size-6" /></div>
        <DialogTitle>Trigger zamanı</DialogTitle>
        <DialogDescription>{trigger.title} · {trigger.durationMinutes} dakika</DialogDescription>
      </DialogHeader>

      <div className="relative mt-5 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Sadece kapat</Button><Button disabled={completing} onClick={onComplete}>Yaptım</Button></div>
    </DialogContent>
  </Dialog>
}
