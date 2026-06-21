import { useState } from 'react'
import { useAdjustTodayPlanItem } from '@/api/daily-plan/queries'
import type { DailyPlanItem } from '@/api/daily-plan/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function DailyPlanItemDialog({ item, maxDurationMinutes, open, onOpenChange }: { item: DailyPlanItem; maxDurationMinutes: number; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [durationMinutes, setDurationMinutes] = useState(item.plannedEndMinute - item.plannedStartMinute)
  const [priority, setPriority] = useState(item.importance)
  const adjustment = useAdjustTodayPlanItem()
  const valid = durationMinutes >= 5 && durationMinutes <= maxDurationMinutes && durationMinutes % 5 === 0 && priority >= 1 && priority <= 5
  async function save() {
    await adjustment.mutateAsync({ itemId: item.id, durationMinutes, priority, version: item.version })
    onOpenChange(false)
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Günlük görevi ayarla</DialogTitle><DialogDescription>{item.taskTitle} için yalnız bugünkü snapshot’a ait süre ve önceliği değiştir.</DialogDescription></DialogHeader><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-semibold">Süre (dakika)<input type="number" min={5} max={maxDurationMinutes} step={5} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border bg-background/60 px-3" /></label><span className="mt-1 block text-xs text-muted-foreground">En fazla {maxDurationMinutes} dk</span></div><label className="text-sm font-semibold">Öncelik<select value={priority} onChange={(event) => setPriority(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border bg-background/60 px-3">{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} · {'★'.repeat(value)}</option>)}</select></label></div><p className="mt-3 text-xs text-muted-foreground">Öncelik değişikliği, henüz başlamamış görevleri aynı zaman bloğu içinde yeniden sıralar.</p>{adjustment.error ? <p role="alert" className="mt-4 text-sm text-destructive">{adjustment.error.message}</p> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button><Button disabled={!valid || adjustment.isPending} onClick={save}>Planı güncelle</Button></DialogFooter></DialogContent></Dialog>
}
