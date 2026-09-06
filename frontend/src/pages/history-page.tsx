import { PageHeader, ErrorState } from '@/components/ui/page'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, History } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useHistoryDays, useHistoryDetail } from '@/api/history/queries'
import type { HistoryDay } from '@/api/history/types'
import { Button } from '@/components/ui/button'
import { formatTime } from '@/features/day-types/time'

const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export function HistoryPage() {
  const [month, setMonth] = useState(() => monthStart(new Date()))
  const [selected, setSelected] = useState<string | null>(null)
  const from = iso(month); const next = new Date(month.getFullYear(), month.getMonth() + 1, 1); const to = iso(new Date(next.getTime() - 86_400_000))
  const history = useHistoryDays(from, to); const detail = useHistoryDetail(selected)
  const dayMap = useMemo(() => new Map(history.data?.map((day) => [day.date, day]) ?? []), [history.data])
  const cells = calendarCells(month)
  if (history.isError) return <ErrorState title="Geçmiş yüklenemedi" retry={() => history.refetch()} />
  return <div className="space-y-6 "><PageHeader title="Geçmiş" description="Planlanan ve gerçekleşen zamanı gün gün incele." />
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="rounded-xl border bg-card p-4 sm:p-6"><div className="flex items-center justify-between"><Button variant="ghost" size="sm" aria-label="Önceki ay" onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); setSelected(null) }}><ChevronLeft className="size-4" /></Button><h2 className="text-lg font-semibold">{new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(month)}</h2><Button variant="ghost" size="sm" aria-label="Sonraki ay" onClick={() => { setMonth(next); setSelected(null) }}><ChevronRight className="size-4" /></Button></div><div className="mt-4 grid grid-cols-7 gap-1">{weekdays.map((day) => <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>)}{cells.map((date, index) => date ? <CalendarCell key={date} date={date} day={dayMap.get(date)} selected={selected === date} onSelect={() => setSelected(date)} /> : <div key={`empty-${index}`} />)}</div>{history.isPending ? <p className="mt-5 text-sm text-muted-foreground" role="status">Takvim yükleniyor…</p> : null}</div>
      <aside className="rounded-xl border bg-card p-5">{!selected ? <div className="grid min-h-72 place-items-center text-center"><div><CalendarDays className="mx-auto size-9 text-primary" /><p className="mt-4 font-semibold">Bir snapshot seç</p><p className="mt-2 text-sm text-muted-foreground">Plan ve gerçekleşen zaman ayrıntısı burada açılır.</p></div></div> : detail.isError ? <ErrorState title="Gün ayrıntısı yüklenemedi" retry={() => detail.refetch()} /> : detail.data ? <DayDetail detail={detail.data} /> : <p role="status" className="text-sm text-muted-foreground">Gün ayrıntısı yükleniyor…</p>}</aside></section>
  </div>
}

function CalendarCell({ date, day, selected, onSelect }: { date: string; day?: HistoryDay; selected: boolean; onSelect: () => void }) {
  const number = Number(date.slice(-2)); const ratio = day && day.plannedMinutes ? Math.min(100, Math.round(day.executedMinutes / day.plannedMinutes * 100)) : 0
  return <button disabled={!day} onClick={onSelect} aria-label={day ? `${date} snapshot'ını aç` : date} aria-pressed={selected} className={`min-w-0 min-h-14 sm:min-h-24 rounded-lg border p-1 sm:p-2 text-left transition-colors ${selected ? 'border-primary bg-primary/15' : day ? 'border-border bg-background/45 hover:border-primary/50' : 'border-transparent text-muted-foreground'}`}><span className="text-xs font-semibold">{number}</span>{day ? <><p className="mt-2 hidden truncate text-xs sm:block text-muted-foreground">{day.dayTypeName}</p><div className="mt-2 h-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${ratio}%` }} /></div><p className="mt-1 hidden text-xs text-muted-foreground sm:block">{day.executedMinutes}/{day.plannedMinutes} dk</p></> : null}</button>
}

function DayDetail({ detail }: { detail: import('@/api/history/types').HistoryDetail }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(`${detail.summary.date}T12:00:00`))}</p><h2 className="mt-2 text-2xl font-semibold">{detail.summary.dayTypeName}</h2><div className="mt-4 grid grid-cols-2 gap-2"><Metric label="Planlanan" value={`${detail.summary.plannedMinutes} dk`} /><Metric label="Gerçekleşen" value={`${detail.summary.executedMinutes} dk`} /></div><h3 className="mt-6 flex items-center gap-2 font-semibold"><Clock3 className="size-4" />Oturumlar</h3><div className="mt-3 space-y-2">{detail.sessions.map((session) => <div key={session.id} className="rounded-xl bg-background/45 p-3"><p className="text-sm font-semibold">{session.taskTitle}</p><p className="mt-1 hidden text-xs text-muted-foreground sm:block">{new Date(session.startedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: detail.plan.timezone })} · {Math.floor(session.durationSeconds / 60)} dk</p></div>)}{!detail.sessions.length ? <p className="text-sm text-muted-foreground">Gerçekleşen oturum yok.</p> : null}</div><h3 className="mt-6 flex items-center gap-2 font-semibold"><History className="size-4" />Olaylar</h3><div className="mt-3 space-y-2">{detail.events.map((event) => <div key={event.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs"><span>{eventLabel(event.type)}</span><span className="text-muted-foreground">{new Date(event.occurredAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: detail.plan.timezone })}</span></div>)}</div><h3 className="mt-6 font-semibold">Plan blokları</h3><div className="mt-3 space-y-2">{detail.plan.blocks.map((block) => <div key={block.id} className="rounded-xl border px-3 py-2 text-sm"><span className="font-semibold">{block.name}</span><span className="float-right text-xs text-muted-foreground">{formatTime(block.startMinute)}–{formatTime(block.endMinute)}</span></div>)}</div></div>
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-background/45 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div> }
function eventLabel(type: string) { return ({ STARTED: 'Başlatıldı', FINISHED: 'Bitirildi', TRANSITIONED: 'Sıradaki göreve geçildi', TIMES_CORRECTED: 'Zaman düzeltildi' } as Record<string, string>)[type] ?? type }
function monthStart(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1) }
function iso(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
function calendarCells(month: Date): Array<string | null> { const first = (month.getDay() + 6) % 7; const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); return [...Array.from({ length: first }, () => null), ...Array.from({ length: count }, (_, i) => iso(new Date(month.getFullYear(), month.getMonth(), i + 1)))] }
