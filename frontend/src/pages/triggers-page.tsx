import { BellRing, Check, Plus, RotateCcw, Zap, Archive } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { useCategories } from '@/api/categories/queries'
import { useDayTypes } from '@/api/day-types/queries'
import { useCompleteTrigger, useCreateTrigger, useSetTriggerStatus, useTriggers } from '@/api/triggers/queries'
import type { TriggerInput, TriggerRule } from '@/api/triggers/types'
import { Button } from '@/components/ui/button'

const initial: TriggerInput = { type: 'HABIT', scheduleType: 'INTERVAL', title: '', description: null, importance: 3, durationMinutes: 5, intervalMinutes: 120, occurrenceTarget: null, categoryIds: [], dayTypeIds: [] }

export function TriggersPage() {
  const triggers = useTriggers(); const categories = useCategories(false, ''); const dayTypes = useDayTypes(false)
  const create = useCreateTrigger(); const complete = useCompleteTrigger(); const status = useSetTriggerStatus()
  const [form, setForm] = useState<TriggerInput>(initial); const [showForm, setShowForm] = useState(false)
  const notified = useRef<Set<string>>(new Set())
  const due = useMemo(() => triggers.data?.filter(isDue) ?? [], [triggers.data])

  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    due.forEach((item) => {
      const key = `${item.id}:${item.nextDueAt ?? 'manual'}`
      if (notified.current.has(key)) return
      new Notification(`ShiftARC · ${item.title}`, { body: `${item.durationMinutes} dakikalık trigger zamanı.` })
      notified.current.add(key)
    })
  }, [due])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await create.mutateAsync(form)
    setForm(initial)
    setShowForm(false)
  }

  return <div className="space-y-8">
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="section-kicker">Kısa ama etkili</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Triggerlar</h1><p className="mt-4 max-w-2xl text-muted-foreground">Aralıklarla veya bir kategorideki işin ardından hatırlanacak küçük eylemler.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => typeof Notification !== 'undefined' && Notification.requestPermission()}><BellRing className="size-4" />Bildirimleri aç</Button><Button onClick={() => setShowForm(!showForm)}><Plus className="size-4" />Yeni trigger</Button></div></section>
    {showForm ? <form onSubmit={submit} className="grid gap-4 rounded-3xl border border-border/70 bg-card/55 p-5 md:grid-cols-2">
      <label className="text-sm">Tip<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as TriggerInput['type'], occurrenceTarget: e.target.value === 'WORK_ITEM' ? 3 : null })} className="mt-2 h-11 w-full rounded-xl border bg-background px-3"><option value="HABIT">Alışkanlık triggerı</option><option value="WORK_ITEM">İş parçacığı triggerı</option></select></label>
      <label className="text-sm">Tetikleme<select value={form.scheduleType} onChange={(e) => setForm({ ...form, scheduleType: e.target.value as TriggerInput['scheduleType'], intervalMinutes: e.target.value === 'INTERVAL' ? 120 : null })} className="mt-2 h-11 w-full rounded-xl border bg-background px-3"><option value="INTERVAL">Belirli aralıklarla</option><option value="AFTER_CATEGORY">Kategori sonrasında</option></select></label>
      <label className="text-sm">Başlık<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 h-11 w-full rounded-xl border bg-background px-3" /></label>
      <label className="text-sm">Süre (dakika)<input type="number" min={5} step={5} value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="mt-2 h-11 w-full rounded-xl border bg-background px-3" /></label>
      {form.scheduleType === 'INTERVAL' ? <label className="text-sm">Aralık (dakika)<input type="number" min={30} value={form.intervalMinutes ?? 120} onChange={(e) => setForm({ ...form, intervalMinutes: Number(e.target.value) })} className="mt-2 h-11 w-full rounded-xl border bg-background px-3" /></label> : <label className="text-sm">Kategori<select required value={form.categoryIds[0] ?? ''} onChange={(e) => setForm({ ...form, categoryIds: [e.target.value] })} className="mt-2 h-11 w-full rounded-xl border bg-background px-3"><option value="">Seç</option>{categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
      {form.type === 'WORK_ITEM' ? <label className="text-sm">Hedef tekrar<input type="number" min={1} value={form.occurrenceTarget ?? 3} onChange={(e) => setForm({ ...form, occurrenceTarget: Number(e.target.value) })} className="mt-2 h-11 w-full rounded-xl border bg-background px-3" /></label> : null}
      <fieldset className="md:col-span-2"><legend className="text-sm font-semibold">Geçerli gün tipleri</legend><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{dayTypes.data?.map((dayType) => <label key={dayType.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={form.dayTypeIds.includes(dayType.id)} onChange={() => setForm((current) => ({ ...current, dayTypeIds: current.dayTypeIds.includes(dayType.id) ? current.dayTypeIds.filter((id) => id !== dayType.id) : [...current.dayTypeIds, dayType.id] }))} /><span className="size-2.5 rounded-full" style={{ backgroundColor: dayType.color }} />{dayType.name}</label>)}</div><p className="mt-2 text-xs text-muted-foreground">Seçim yapmazsan trigger her gün tipinde geçerli olur.</p></fieldset>
      <div className="flex justify-end md:col-span-2"><Button disabled={create.isPending}>Trigger oluştur</Button></div>
    </form> : null}
    {due.length ? <section className="rounded-3xl border border-amber-400/40 bg-amber-400/10 p-5"><p className="flex items-center gap-2 font-semibold"><Zap className="size-5" />Şimdi tetiklenenler</p><div className="mt-4 grid gap-3">{due.map((item) => <TriggerCard key={item.id} item={item} due onComplete={() => complete.mutate({ id: item.id, version: item.version })} onStatus={() => status.mutate({ id: item.id, version: item.version, status: 'ARCHIVED' })} />)}</div></section> : null}
    <section className="grid gap-3 md:grid-cols-2">{triggers.data?.filter((item) => !due.includes(item)).map((item) => <TriggerCard key={item.id} item={item} due={false} onComplete={() => complete.mutate({ id: item.id, version: item.version })} onStatus={() => status.mutate({ id: item.id, version: item.version, status: item.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED' })} />)}</section>
  </div>
}

function isDue(item: TriggerRule) {
  return item.status === 'ACTIVE' && Boolean(item.nextDueAt) && new Date(item.nextDueAt as string) <= new Date()
}

function TriggerCard({ item, due, onComplete, onStatus }: { item: TriggerRule; due: boolean; onComplete: () => void; onStatus: () => void }) {
  const scope = item.dayTypes.length ? item.dayTypes.map((dayType) => dayType.name).join(', ') : 'Her gün tipi'
  return <article className={`rounded-2xl border p-5 ${due ? 'border-amber-400/50 bg-background/70 shadow-[0_0_30px_rgba(251,191,36,.12)]' : 'bg-card/50'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.type === 'HABIT' ? 'Alışkanlık' : 'İş parçacığı'} · {item.durationMinutes} dk</p><h2 className="mt-2 text-lg font-semibold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.scheduleType === 'INTERVAL' ? `Her ${item.intervalMinutes} dakikada` : `${item.categories.map((c) => c.name).join(', ')} sonrasında`}</p><p className="mt-1 text-xs text-muted-foreground">{scope}</p>{item.occurrenceTarget ? <p className="mt-1 text-xs text-muted-foreground">{item.completedOccurrences}/{item.occurrenceTarget} tamamlandı</p> : null}</div><span className="text-amber-400">{'★'.repeat(item.importance)}</span></div><div className="mt-4 flex justify-end gap-2">{item.status === 'ACTIVE' ? <><Button size="sm" variant="outline" onClick={onStatus}><Archive className="size-4" />Arşivle</Button>{due ? <Button size="sm" onClick={onComplete}><Check className="size-4" />Yaptım</Button> : null}</> : item.status === 'ARCHIVED' ? <Button size="sm" variant="outline" onClick={onStatus}><RotateCcw className="size-4" />Etkinleştir</Button> : <span className="text-sm text-muted-foreground">Tamamlandı</span>}</div></article>
}
