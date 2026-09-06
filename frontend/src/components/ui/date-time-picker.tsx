import * as Popover from '@radix-ui/react-popover'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'

const pad = (value: number) => String(value).padStart(2, '0')

export function TimePicker({
  value,
  onChange,
  disabled,
  minMinute = 0,
  maxMinute = 1440,
  label = 'Saat seç',
}: {
  value: number
  onChange: (minute: number) => void
  disabled?: boolean
  minMinute?: number
  maxMinute?: number
  label?: string
}) {
  const options = useMemo(() => {
    const start = Math.max(0, Math.ceil(minMinute / 5) * 5)
    const end = Math.min(1440, Math.floor(maxMinute / 5) * 5)
    return Array.from({ length: Math.max(0, Math.floor((end - start) / 5) + 1) }, (_, index) => start + index * 5)
  }, [maxMinute, minMinute])

  return (
    <Popover.Root>
      <Popover.Trigger disabled={disabled} type="button" aria-label={label} className="mt-2 flex h-11 w-full items-center gap-3 rounded-xl border border-input bg-card/65 px-3 text-sm outline-none transition hover:border-primary/35 focus:ring-2 focus:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-55">
        <Clock3 className="size-4 text-primary" />
        <span className="font-mono">{formatMinute(value)}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} className="z-50 max-h-72 w-48 overflow-y-auto rounded-lg border border-border/80 bg-popover/96 p-2 shadow-2xl shadow-black/35 backdrop-blur-xl">
          {options.map((minute) => (
            <Popover.Close key={minute} asChild>
              <button type="button" onClick={() => onChange(minute)} className={`block w-full rounded-xl px-3 py-2 text-left font-mono text-sm transition hover:bg-accent ${minute === value ? 'bg-primary/15 text-primary' : ''}`}>
                {formatMinute(minute)}
              </button>
            </Popover.Close>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function DatePicker({
  value,
  onChange,
  disabled,
  label = 'Tarih seç',
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
}) {
  const selected = value ? new Date(`${value}T12:00:00`) : new Date()
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const monthLabel = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(month)

  return (
    <Popover.Root>
      <Popover.Trigger disabled={disabled} type="button" aria-label={label} className="mt-2 flex h-11 w-full items-center gap-3 rounded-xl border border-input bg-card/65 px-3 text-sm outline-none transition hover:border-primary/35 focus:ring-2 focus:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-55">
        <CalendarDays className="size-4 text-primary" />
        <span>{value ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(selected) : 'Tarih seç'}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} className="z-50 w-80 rounded-lg border border-border/80 bg-popover/96 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <Button type="button" size="sm" variant="ghost" aria-label="Önceki ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button>
            <p className="font-semibold capitalize">{monthLabel}</p>
            <Button type="button" size="sm" variant="ghost" aria-label="Sonraki ay" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendarCells(month).map((date, index) => date ? (
              <Popover.Close key={date} asChild>
                <button type="button" onClick={() => onChange(date)} className={`rounded-xl px-2 py-2 text-sm transition hover:bg-accent ${date === value ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-background/35'}`}>
                  {Number(date.slice(-2))}
                </button>
              </Popover.Close>
            ) : <span key={`empty-${index}`} />)}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  label,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label: string
}) {
  const [datePart, timePart = '00:00'] = value.split('T')

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_8rem]">
      <DatePicker value={datePart} onChange={(date) => onChange(`${date}T${timePart}`)} disabled={disabled} label={`${label} tarihi`} />
      <TimePicker value={timeToMinute(timePart)} onChange={(minute) => onChange(`${datePart}T${formatMinute(minute)}`)} disabled={disabled} label={`${label} saati`} />
    </div>
  )
}

function formatMinute(minute: number) {
  if (minute >= 1440) return '24:00'
  return `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`
}

function timeToMinute(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function calendarCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const firstOffset = (first.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  return Array.from({ length: firstOffset + days }, (_, index) => {
    if (index < firstOffset) return null
    const day = index - firstOffset + 1
    return `${month.getFullYear()}-${pad(month.getMonth() + 1)}-${pad(day)}`
  })
}
