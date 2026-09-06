import { PageHeader, EmptyState, ErrorState, StatusBadge } from '@/components/ui/page'
import { Archive, BellRing, Check, Plus, RotateCcw, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'

import { useCategories } from '@/api/categories/queries'
import { useDayTypes } from '@/api/day-types/queries'
import { useCompleteTrigger, useCreateTrigger, useSetTriggerStatus, useTriggers } from '@/api/triggers/queries'
import type { TriggerInput, TriggerRule } from '@/api/triggers/types'
import { Button } from '@/components/ui/button'
import { NumberStepper } from '@/components/ui/number-stepper'
import { Select } from '@/components/ui/select'

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
    try { await create.mutateAsync(form); setForm(initial); setShowForm(false) } catch { /* Mutation feedback remains visible. */ }
  }

  return <div className="space-y-6">
    <PageHeader title="Triggerlar" description="Kısa eylemlerin zamanını ve tekrarlarını yönet." actions={<><Button variant="outline" onClick={() => typeof Notification !== 'undefined' && Notification.requestPermission()}><BellRing className="size-4" />Bildirimleri aç</Button><Button onClick={() => setShowForm(!showForm)}><Plus className="size-4" />Yeni trigger</Button></>} />
    {triggers.isPending ? <p role="status">Triggerlar yükleniyor…</p> : null}
    {triggers.isError ? <ErrorState title="Triggerlar yüklenemedi" retry={() => triggers.refetch()} /> : null}
    {!triggers.isPending && !triggers.isError && !triggers.data?.length ? <EmptyState title="Henüz trigger yok" description="Tekrarlamak istediğin kısa bir eylem ekle." /> : null}
    {create.error || complete.error || status.error ? <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-destructive">{(create.error ?? complete.error ?? status.error)?.message}</p> : null}

    {showForm ? <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border/70 bg-card p-5 md:grid-cols-2">
      <label className="text-sm">Tip<Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as TriggerInput['type'], occurrenceTarget: value === 'WORK_ITEM' ? 3 : null })} ariaLabel="Trigger tipi" options={[{ value: 'HABIT', label: 'Alışkanlık triggerı' }, { value: 'WORK_ITEM', label: 'İş parçacığı triggerı' }]} /></label>
      <label className="text-sm">Tetikleme<Select value={form.scheduleType} onValueChange={(value) => setForm({ ...form, scheduleType: value as TriggerInput['scheduleType'], intervalMinutes: value === 'INTERVAL' ? 120 : null })} ariaLabel="Tetikleme" options={[{ value: 'INTERVAL', label: 'Belirli aralıklarla' }, { value: 'AFTER_CATEGORY', label: 'Kategori sonrasında' }]} /></label>
      <label className="text-sm">Başlık<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 h-11 w-full rounded-xl border bg-background px-3" /></label>
      <label className="text-sm">Süre (dakika)<NumberStepper value={form.durationMinutes} min={5} step={5} onChange={(value) => setForm({ ...form, durationMinutes: value })} ariaLabel="Trigger süresi" /></label>
      {form.scheduleType === 'INTERVAL' ? <label className="text-sm">Aralık (dakika)<NumberStepper value={form.intervalMinutes ?? 120} min={30} step={5} onChange={(value) => setForm({ ...form, intervalMinutes: value })} ariaLabel="Trigger aralığı" /></label> : <label className="text-sm">Kategori<Select value={form.categoryIds[0] ?? ''} onValueChange={(value) => setForm({ ...form, categoryIds: value ? [value] : [] })} ariaLabel="Trigger kategorisi" options={[{ value: '', label: 'Seç' }, ...(categories.data?.map((c) => ({ value: c.id, label: c.name })) ?? [])]} /></label>}
      {form.type === 'WORK_ITEM' ? <label className="text-sm">Hedef tekrar<NumberStepper value={form.occurrenceTarget ?? 3} min={1} onChange={(value) => setForm({ ...form, occurrenceTarget: value })} ariaLabel="Hedef tekrar" /></label> : null}
      <fieldset className="md:col-span-2"><legend className="text-sm font-semibold">Geçerli gün tipleri</legend><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{dayTypes.data?.map((dayType) => <label key={dayType.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={form.dayTypeIds.includes(dayType.id)} onChange={() => setForm((current) => ({ ...current, dayTypeIds: current.dayTypeIds.includes(dayType.id) ? current.dayTypeIds.filter((id) => id !== dayType.id) : [...current.dayTypeIds, dayType.id] }))} /><span className="size-2.5 rounded-full" style={{ backgroundColor: dayType.color }} />{dayType.name}</label>)}</div><p className="mt-2 text-xs text-muted-foreground">Seçim yapmazsan trigger her gün tipinde geçerli olur.</p></fieldset>
      <div className="flex justify-end md:col-span-2"><Button disabled={create.isPending}>Trigger oluştur</Button></div>
    </form> : null}
    {due.length ? <section className="rounded-xl border border-warning/40 bg-warning/10 p-5"><p className="flex items-center gap-2 font-semibold"><Zap className="size-5" />Şimdi tetiklenenler</p><div className="mt-4 grid gap-3">{due.map((item) => <TriggerCard key={item.id} item={item} due onComplete={() => complete.mutate({ id: item.id, version: item.version })} onStatus={() => status.mutate({ id: item.id, version: item.version, status: 'ARCHIVED' })} />)}</div></section> : null}
    <section className="grid gap-2">{triggers.data?.filter((item) => !due.includes(item)).map((item) => <TriggerCard key={item.id} item={item} due={false} onComplete={() => complete.mutate({ id: item.id, version: item.version })} onStatus={() => status.mutate({ id: item.id, version: item.version, status: item.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED' })} />)}</section>
  </div>
}

function isDue(item: TriggerRule) {
  return item.status === 'ACTIVE' && Boolean(item.nextDueAt) && new Date(item.nextDueAt as string) <= new Date()
}

function TriggerCard({ item, due, onComplete, onStatus }: { item: TriggerRule; due: boolean; onComplete: () => void; onStatus: () => void }) {
  const scope = item.dayTypes.length ? item.dayTypes.map((dayType) => dayType.name).join(', ') : 'Her gün tipi'
  return <article className={`rounded-lg border p-5 ${due ? 'border-warning/50 bg-warning/5' : 'bg-card'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{item.type === 'HABIT' ? 'Alışkanlık' : 'İş parçacığı'} · {item.durationMinutes} dk</p><h2 className="mt-2 text-lg font-semibold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.scheduleType === 'INTERVAL' ? `Her ${item.intervalMinutes} dakikada` : `${item.categories.map((c) => c.name).join(', ')} sonrasında`}</p><p className="mt-1 text-xs text-muted-foreground">{scope}</p>{item.occurrenceTarget ? <p className="mt-1 text-xs text-muted-foreground">{item.completedOccurrences}/{item.occurrenceTarget} tamamlandı</p> : null}</div><StatusBadge tone={due ? 'warning' : 'neutral'}>{due ? 'Zamanı geldi' : item.status === 'ACTIVE' ? 'Aktif' : item.status === 'ARCHIVED' ? 'Arşivde' : 'Tamamlandı'} · {item.importance}/5</StatusBadge></div><div className="mt-4 flex justify-end gap-2">{item.status === 'ACTIVE' ? <><Button size="sm" variant="outline" onClick={onStatus}><Archive className="size-4" />Arşivle</Button>{due ? <Button size="sm" onClick={onComplete}><Check className="size-4" />Yaptım</Button> : null}</> : item.status === 'ARCHIVED' ? <Button size="sm" variant="outline" onClick={onStatus}><RotateCcw className="size-4" />Etkinleştir</Button> : <span className="text-sm text-muted-foreground">Tamamlandı</span>}</div></article>
}
