import type { DayType } from '@/api/day-types/types'
import { useArchiveDayType } from '@/api/day-types/queries'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function DayTypeDeleteDialog({ dayType, open, onOpenChange, onDeleted }: { dayType: DayType; open: boolean; onOpenChange: (open: boolean) => void; onDeleted: () => void }) {
  const remove = useArchiveDayType()
  async function confirm() {
    await remove.mutateAsync({ id: dayType.id, version: dayType.version })
    onOpenChange(false)
    onDeleted()
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Gün tipini sil</DialogTitle><DialogDescription><strong>{dayType.name}</strong> aktif listeden kaldırılacak. Geçmiş planların bütünlüğü için veriler korunur; “Arşivlenenleri göster” seçeneğinden geri yükleyebilirsin.</DialogDescription></DialogHeader>{remove.error ? <p role="alert" className="mt-4 text-sm text-destructive">{remove.error.message}</p> : null}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button><Button className="bg-destructive text-white hover:bg-destructive/90" disabled={remove.isPending} onClick={confirm}>Gün tipini sil</Button></DialogFooter></DialogContent></Dialog>
}
