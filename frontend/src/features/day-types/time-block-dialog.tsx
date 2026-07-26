import { useState } from 'react'

import type { Category } from '@/api/categories/types'
import type { DayTypeBlock } from '@/api/day-types/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TimePicker } from '@/components/ui/date-time-picker'
import { formatTime } from '@/features/day-types/time'

export function TimeBlockDialog({
  block,
  categories,
  open,
  canDelete,
  minimumStart,
  maximumEnd,
  onOpenChange,
  onSave,
  onDelete,
}: {
  block: DayTypeBlock | null
  categories: Category[]
  open: boolean
  canDelete: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, categoryIds: string[], startMinute: number, endMinute: number) => void
  onDelete: () => void
  minimumStart: number | null
  maximumEnd: number | null
}) {
  const [name, setName] = useState(block?.name === 'Plansız' ? '' : block?.name ?? '')
  const [categoryIds, setCategoryIds] = useState<string[]>(block?.categoryIds ?? [])
  const [startMinute, setStartMinute] = useState(block?.startMinute ?? 0)
  const [endMinute, setEndMinute] = useState(block?.endMinute ?? 1440)

  if (!block) return null

  const toggleCategory = (id: string) => {
    setCategoryIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  const validRange = startMinute >= 0
    && endMinute <= 1440
    && startMinute < endMinute
    && startMinute % 5 === 0
    && endMinute % 5 === 0
    && (minimumStart === null || startMinute >= minimumStart)
    && (maximumEnd === null || endMinute <= maximumEnd)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Zaman bloğunu düzenle</DialogTitle>
          <DialogDescription>{formatTime(block.startMinute)}–{formatTime(block.endMinute)} aralığının görev bağlamını belirle.</DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Başlangıç
              <TimePicker
                value={startMinute}
                onChange={setStartMinute}
                disabled={minimumStart === null}
                minMinute={minimumStart ?? 0}
                maxMinute={endMinute - 5}
                label="Başlangıç saati"
              />
            </label>
            <label className="block text-sm font-semibold">
              Bitiş
              <TimePicker
                value={endMinute}
                onChange={setEndMinute}
                disabled={maximumEnd === null}
                minMinute={startMinute + 5}
                maxMinute={maximumEnd ?? 1440}
                label="Bitiş saati"
              />
              {endMinute === 1440 ? <span className="mt-1 block text-xs font-normal text-muted-foreground">Gün sonu: 24:00</span> : null}
            </label>
          </div>
          <label className="block text-sm font-semibold">
            Blok adı
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn. Derin çalışma" className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3" />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Kabul edilen kategoriler</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label key={category.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-card/35 p-3 text-sm transition hover:border-primary/35">
                  <input type="checkbox" checked={categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                  {category.name}
                </label>
              ))}
            </div>
            {!categories.length ? <p className="mt-3 text-sm text-muted-foreground">Henüz aktif kategori yok; bloğu kategorisiz kaydedebilirsin.</p> : null}
          </fieldset>
        </div>
        <DialogFooter className="sm:justify-between">
          {canDelete ? <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>Zaman bloğunu sil</Button> : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
            <Button type="button" disabled={!name.trim() || !validRange} onClick={() => onSave(name.trim(), categoryIds, startMinute, endMinute)}>Bloğu kaydet</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
