import { AlertTriangle, CalendarDays, CheckCircle2, Play, RefreshCw, SkipForward, Sparkles, Square, Timer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useRegenerateTodayPlan, useTodayPlan } from '@/api/daily-plan/queries'
import type { DailyPlan } from '@/api/daily-plan/types'
import { useExecutionState, useFinishExecution, useStartExecution, useTransitionExecution } from '@/api/execution/queries'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/features/day-types/time'

export function TodayPage() {
  const plan = useTodayPlan()
  const regenerate = useRegenerateTodayPlan()
  if (plan.isPending) return <div className="grid min-h-[70vh] place-items-center" role="status">Bugünün planı oluşturuluyor…</div>
  if (plan.isError || !plan.data) return <div className="grid min-h-[70vh] place-items-center text-center"><div><AlertTriangle className="mx-auto size-8 text-amber-400" /><h1 className="mt-4 text-xl font-semibold">Bugünün planı oluşturulamadı</h1><p className="mt-2 max-w-md text-sm text-muted-foreground">{plan.error?.message}</p><Button className="mt-5" variant="outline" onClick={() => plan.refetch()}>Yeniden dene</Button></div></div>
  return <TodayPlan plan={plan.data} onRegenerate={() => regenerate.mutate(plan.data.version)} regenerating={regenerate.isPending} />
}

function TodayPlan({ plan, onRegenerate, regenerating }: { plan: DailyPlan; onRegenerate: () => void; regenerating: boolean }) {
  const [now, setNow] = useState(() => new Date())
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
  const activeSession = execution.data?.activeSession
  const orderedItems = plan.blocks.flatMap((block) => block.items)
  const activeIndex = activeSession?.dailyPlanItemId ? orderedItems.findIndex((item) => item.id === activeSession.dailyPlanItemId) : -1
  const nextItem = orderedItems.find((item, index) => item.status === 'PLANNED' && index > activeIndex)
    ?? orderedItems.find((item) => item.status === 'PLANNED')
  const elapsedSeconds = activeSession ? Math.max(0, Math.floor((now.getTime() - new Date(activeSession.startedAt).getTime()) / 1000)) : 0
  const atmosphere = time.hour < 6 ? 'from-indigo-950/45 via-background to-background' : time.hour < 12 ? 'from-amber-400/12 via-background to-background' : time.hour < 18 ? 'from-emerald-400/10 via-background to-background' : 'from-violet-500/15 via-background to-background'

  return <div className={`-mx-5 -mt-8 min-h-[calc(100svh-4.5rem)] bg-gradient-to-b ${atmosphere} px-5 pt-10 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10`}>
    <section className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="section-kicker">{new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: plan.timezone }).format(now)}</p><div className="mt-3 flex items-baseline font-mono tracking-[-0.08em]"><span className="text-7xl font-semibold sm:text-9xl">{pad(time.hour)}:{pad(time.minute)}</span><span className="ml-3 text-2xl text-primary sm:text-4xl">{pad(time.second)}</span></div><p className="mt-3 text-sm text-muted-foreground">{plan.sourceDayTypeName} · {plan.timezone}</p></div>
      <div className="flex flex-wrap items-center gap-3"><div className="rounded-2xl border bg-card/55 px-4 py-3"><p className="text-xs text-muted-foreground">Planlanan görev süresi</p><p className="mt-1 font-semibold">{Math.floor(plannedMinutes / 60)} sa {plannedMinutes % 60} dk</p></div><Button variant="outline" onClick={onRegenerate} disabled={regenerating || Boolean(activeSession)}><RefreshCw className={`size-4 ${regenerating ? 'animate-spin' : ''}`} />Yenile</Button></div>
    </section>

    <section className="mt-10 rounded-3xl border border-border/70 bg-card/45 p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Şu anda</p><h1 className="mt-2 text-2xl font-semibold">{currentItem?.taskTitle ?? currentBlock?.name ?? 'Gün tamamlandı'}</h1><p className="mt-1 text-sm text-muted-foreground">{currentItem ? `${formatTime(currentItem.plannedStartMinute)}–${formatTime(currentItem.plannedEndMinute)} · ${currentBlock?.name}` : currentBlock ? `${formatTime(currentBlock.startMinute)}–${formatTime(currentBlock.endMinute)}` : ''}</p></div><div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">{currentItem ? <Timer className="size-5" /> : <CalendarDays className="size-5" />}</div></div>
      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">{activeSession ? <><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Aktif çalışma</p><p className="mt-1 font-semibold">{activeSession.taskTitle}</p><p className="mt-1 font-mono text-sm text-muted-foreground">{duration(elapsedSeconds)}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => finishExecution.mutate({ sessionId: activeSession.id, version: activeSession.version })}><Square className="size-4" />Bitir</Button>{nextItem ? <Button onClick={() => transitionExecution.mutate({ sessionId: activeSession.id, nextDailyPlanItemId: nextItem.id, version: activeSession.version })}><SkipForward className="size-4" />Sıradaki görev</Button> : null}</div></> : <><div><p className="font-semibold">{nextItem ? `Sırada: ${nextItem.taskTitle}` : 'Planlanan görevler tamamlandı'}</p><p className="mt-1 text-xs text-muted-foreground">Başlangıç saati gerçek yürütme geçmişine kaydedilir.</p></div>{nextItem ? <Button onClick={() => startExecution.mutate(nextItem.id)}><Play className="size-4" />Görevi başlat</Button> : <CheckCircle2 className="size-6 text-primary" />}</>}</div>
      <div className="mt-7 overflow-x-auto pb-2"><div className="relative flex h-40 min-w-[800px] overflow-hidden rounded-2xl border bg-background/40">{plan.blocks.map((block) => <div key={block.id} className="relative border-r border-border/50 last:border-0" style={{ width: `${((block.endMinute - block.startMinute) / 1440) * 100}%` }}><div className="absolute inset-0 bg-primary/8" /><p className="relative z-10 truncate p-2 text-[10px] font-semibold text-muted-foreground">{block.name}</p>{block.items.map((item) => <div key={item.id} className={`absolute top-8 bottom-2 rounded-lg px-2 py-2 text-[10px] font-semibold text-primary-foreground ${item.status === 'COMPLETED' ? 'bg-emerald-500/75' : item.status === 'ACTIVE' ? 'animate-pulse bg-primary' : 'bg-primary/80'}`} style={{ left: `${((item.plannedStartMinute - block.startMinute) / (block.endMinute - block.startMinute)) * 100}%`, width: `${((item.plannedEndMinute - item.plannedStartMinute) / (block.endMinute - block.startMinute)) * 100}%` }} title={`${item.taskTitle} · ${formatTime(item.plannedStartMinute)}–${formatTime(item.plannedEndMinute)}`}><span className="line-clamp-3">{item.taskTitle}</span></div>)}</div>)}<div className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]" style={{ left: `${Math.max(0, Math.min(100, (minute / 1440) * 100))}%` }} aria-label="Şu an göstergesi" /></div></div>
    </section>
    <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]"><div className="grid gap-3 sm:grid-cols-2">{plan.blocks.flatMap((block) => block.items.map((item) => <article key={item.id} className="rounded-2xl border border-border/70 bg-card/45 p-4"><div className="flex items-start justify-between"><span className="text-xs text-muted-foreground">{formatTime(item.plannedStartMinute)}–{formatTime(item.plannedEndMinute)}</span><span className="text-amber-400">{'★'.repeat(item.importance)}</span></div><h2 className="mt-2 font-semibold">{item.taskTitle}</h2><p className="mt-1 text-xs text-muted-foreground">{block.name} · {item.taskType === 'WORK_ITEM' ? 'İş parçacığı' : 'Alışkanlık'}</p></article>))}</div><aside className="rounded-2xl border border-border/70 bg-card/45 p-5"><p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" />Plan notları</p>{plan.warnings.length ? <div className="mt-4 space-y-3">{plan.warnings.map((warning) => <p key={`${warning.taskId}-${warning.reasonCode}`} className="rounded-xl bg-amber-400/8 p-3 text-xs leading-5 text-amber-200">{warning.detail} ({warning.unallocatedMinutes} dk)</p>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Bütün günlük süre istekleri uygun bloklara yerleştirildi.</p>}</aside></section>
  </div>
}

function zonedTime(date: Date, timezone: string) { const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date); const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0); return { hour: value('hour'), minute: value('minute'), second: value('second') } }
function pad(value: number) { return String(value).padStart(2, '0') }
function duration(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const rest = seconds % 60; return `${pad(hours)}:${pad(minutes)}:${pad(rest)}` }
