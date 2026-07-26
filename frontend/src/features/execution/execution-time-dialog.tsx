import { useState } from 'react'

import { useCorrectExecutionTimes } from '@/api/execution/queries'
import type { ExecutionSession } from '@/api/execution/types'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function ExecutionTimeDialog({ session, open, onOpenChange }: { session: ExecutionSession; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [startedAt, setStartedAt] = useState(toLocalInput(session.startedAt))
  const [endedAt, setEndedAt] = useState(session.endedAt ? toLocalInput(session.endedAt) : '')
  const correction = useCorrectExecutionTimes()
  const valid = Boolean(startedAt) && (!session.endedAt || Boolean(endedAt)) && (!endedAt || new Date(endedAt) > new Date(startedAt))

  const save = async () => {
    await correction.mutateAsync({ sessionId: session.id, startedAt: new Date(startedAt).toISOString(), endedAt: endedAt ? new Date(endedAt).toISOString() : null, version: session.version })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Çalışma zamanını düzelt</DialogTitle>
          <DialogDescription>{session.taskTitle} oturumunun gerçek başlangıç ve bitiş saatlerini düzenle.</DialogDescription>
        </DialogHeader>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Başlangıç
            <DateTimePicker value={startedAt} onChange={setStartedAt} label="Başlangıç" />
          </label>
          <label className="text-sm font-semibold">
            Bitiş
            <DateTimePicker value={endedAt} disabled={!session.endedAt} onChange={setEndedAt} label="Bitiş" />
          </label>
        </div>
        {!session.endedAt ? <p className="mt-3 text-xs text-muted-foreground">Aktif oturumlarda bitiş saati, oturum tamamlandıktan sonra düzeltilebilir.</p> : null}
        {correction.error ? <p role="alert" className="mt-4 text-sm text-destructive">{correction.error.message}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button disabled={!valid || correction.isPending} onClick={save}>Zamanı kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function toLocalInput(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
