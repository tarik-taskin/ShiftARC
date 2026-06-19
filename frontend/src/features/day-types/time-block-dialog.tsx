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
import { formatTime } from '@/features/day-types/time'

export function TimeBlockDialog({
  block,
  categories,
  open,
  canDelete,
  onOpenChange,
  onSave,
  onDelete,
}: {
  block: DayTypeBlock | null
  categories: Category[]
  open: boolean
  canDelete: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string, categoryIds: string[]) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(block?.name === 'Plansız' ? '' : block?.name ?? '')
  const [categoryIds, setCategoryIds] = useState<string[]>(block?.categoryIds ?? [])

  if (!block) return null

  const toggleCategory = (id: string) => {
    setCategoryIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zaman bloğunu düzenle</DialogTitle>
          <DialogDescription>{formatTime(block.startMinute)}–{formatTime(block.endMinute)} aralığının görev bağlamını belirle.</DialogDescription>
        </DialogHeader>
        <div className="mt-6 space-y-5">
          <label className="block text-sm font-semibold">
            Blok adı
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn. Derin çalışma" className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3" />
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Kabul edilen kategoriler</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label key={category.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-3 text-sm">
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
          {canDelete ? <Button type="button" variant="ghost" onClick={onDelete}>Bloğu birleştir</Button> : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
            <Button type="button" disabled={!name.trim()} onClick={() => onSave(name.trim(), categoryIds)}>Bloğu kaydet</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
