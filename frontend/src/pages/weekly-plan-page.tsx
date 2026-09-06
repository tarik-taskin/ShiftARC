import { PageHeader } from '@/components/ui/page'
import { motion, useReducedMotion } from 'motion/react'
import { CalendarCheck2, CalendarRange, CircleAlert, Save } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useDayTypes } from '@/api/day-types/queries'
import type { DayType } from '@/api/day-types/types'
import { useUpdateWeeklyPlan, useWeeklyPlan } from '@/api/weekly-plan/queries'
import type { WeeklyPlan } from '@/api/weekly-plan/types'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { formatTime } from '@/features/day-types/time'

const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export function WeeklyPlanPage() {
  const plan = useWeeklyPlan()
  const dayTypes = useDayTypes(false)

  if (plan.isPending || dayTypes.isPending) {
    return <div className="grid min-h-[60vh] place-items-center" role="status">Haftalık plan yükleniyor…</div>
  }
  if (plan.isError || dayTypes.isError || !plan.data || !dayTypes.data) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div><p className="font-semibold">Haftalık plan yüklenemedi</p><Button className="mt-4" variant="outline" onClick={() => { plan.refetch(); dayTypes.refetch() }}>Yeniden dene</Button></div>
      </div>
    )
  }

  return (
    <WeeklyPlanEditor
      key={`${plan.data.version}-${plan.data.days.map((day) => day.dayType?.id ?? '-').join(':')}`}
      plan={plan.data}
      dayTypes={dayTypes.data}
    />
  )
}

function WeeklyPlanEditor({ plan, dayTypes }: { plan: WeeklyPlan; dayTypes: DayType[] }) {
  const [assignments, setAssignments] = useState<Record<number, string>>(() =>
    plan.days.reduce<Record<number, string>>((result, day) => {
      if (day.dayType) result[day.dayOfWeek] = day.dayType.id
      return result
    }, {}),
  )
  const updatePlan = useUpdateWeeklyPlan()
  const reduceMotion = useReducedMotion()
  const assignedCount = Object.values(assignments).filter(Boolean).length
  const original = plan.days.map((day) => day.dayType?.id ?? '').join(':')
  const current = dayNames.map((_, index) => assignments[index + 1] ?? '').join(':')
  const changed = original !== current
  const assignedTypes = useMemo(
    () => new Set(Object.values(assignments).filter(Boolean)).size,
    [assignments],
  )

  const save = () => updatePlan.mutate({
    version: plan.version,
    assignments: Object.entries(assignments)
      .filter(([, dayTypeId]) => Boolean(dayTypeId))
      .map(([dayOfWeek, dayTypeId]) => ({ dayOfWeek: Number(dayOfWeek), dayTypeId })),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Haftalık plan" description="Tekrarlayan haftanın gün tiplerini belirle. Tarih istisnalarını Takvim’den yönet." actions={<Button onClick={save} disabled={!changed || updatePlan.isPending}><Save className="size-4" />{updatePlan.isPending ? 'Kaydediliyor…' : 'Haftayı kaydet'}</Button>} />

      <section className="grid gap-3 rounded-xl border bg-card sm:grid-cols-3">
        <Summary icon={CalendarCheck2} label="Atanan gün" value={`${assignedCount} / 7`} />
        <Summary icon={CalendarRange} label="Kullanılan gün tipi" value={String(assignedTypes)} />
        <Summary icon={CircleAlert} label="Plan durumu" value={assignedCount === 7 ? 'Tamamlandı' : `${7 - assignedCount} gün eksik`} />
      </section>

      {!dayTypes.length ? (
        <section className="rounded-xl border border-dashed border-border p-10 text-center">
          <CalendarRange className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Önce bir gün tipi oluştur</h2>
          <p className="mt-2 text-sm text-muted-foreground">Haftaya atayabileceğin aktif bir gün tipi henüz yok.</p>
          <Button className="mt-5" variant="outline" asChild><a href="/day-types">Gün tiplerine git</a></Button>
        </section>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-7">
          {dayNames.map((dayName, index) => {
            const dayOfWeek = index + 1
            const selected = dayTypes.find((dayType) => dayType.id === assignments[dayOfWeek])
            return (
              <motion.article
                key={dayName}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.14 }}
                className="min-w-0 rounded-xl border border-border/75 bg-card p-3 2xl:min-h-[340px]"
                style={{ borderColor: selected ? `${selected.color}88` : undefined }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div><p className="text-xs text-muted-foreground">{dayOfWeek}. gün</p><h2 className="mt-1 font-semibold">{dayName}</h2></div>
                  <span className="size-3 rounded-full border border-border" style={{ backgroundColor: selected?.color }} />
                </div>
                <label className="mt-5 block text-xs font-semibold text-muted-foreground">
                  Gün tipi
                  <Select
                    ariaLabel={`${dayName} gün tipi`}
                    value={assignments[dayOfWeek] ?? ''}
                    onValueChange={(value) => setAssignments((currentAssignments) => ({ ...currentAssignments, [dayOfWeek]: value }))}
                    options={[{ value: '', label: 'Seçilmedi' }, ...dayTypes.map((dayType) => ({ value: dayType.id, label: dayType.name }))]}
                    className="h-10"
                  />
                </label>
                {selected ? <DayPreview dayType={selected} /> : <div className="mt-5 grid min-h-44 place-items-center rounded-lg border border-dashed border-border/70 text-center text-xs text-muted-foreground">Bu gün henüz boş</div>}
              </motion.article>
            )
          })}
        </section>
      )}

      {updatePlan.error ? <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/8 p-4 text-sm text-destructive">{updatePlan.error.message}</p> : null}
      {updatePlan.isSuccess ? <p role="status" className="text-sm text-primary">Haftalık plan kaydedildi.</p> : null}
    </div>
  )
}

function DayPreview({ dayType }: { dayType: DayType }) {
  return (
    <div className="mt-5 space-y-2">
      <p className="truncate text-sm font-semibold">{dayType.name}</p>
      <div className="flex h-32 overflow-hidden rounded-lg border border-border/50 2xl:flex-col">
        {dayType.blocks.map((block) => (
          <div
            key={block.id}
            className="grid min-w-0 place-items-center border-r border-background/30 px-1 text-center text-xs font-semibold text-foreground last:border-0 2xl:border-r-0 2xl:border-b"
            style={{ backgroundColor: `color-mix(in srgb, ${dayType.color} 18%, var(--card))`, flex: block.endMinute - block.startMinute }}
            title={`${block.name} · ${formatTime(block.startMinute)}–${formatTime(block.endMinute)}`}
          >
            <span className="line-clamp-2">{block.name}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{dayType.blocks.length} zaman bloğu</p>
    </div>
  )
}

function Summary({ icon: Icon, label, value }: { icon: typeof CalendarRange; label: string; value: string }) {
  return <article className="flex items-center gap-3 rounded-lg border border-border/70 bg-card p-4"><div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div></article>
}
