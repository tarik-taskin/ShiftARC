import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useCreateDayType, useUpdateDayType } from '@/api/day-types/queries'
import type { DayType } from '@/api/day-types/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const schema = z.object({
  name: z.string().trim().min(1, 'Gün tipi adı zorunludur.').max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

type Values = z.infer<typeof schema>

export function DayTypeDialog({
  open,
  onOpenChange,
  dayType,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  dayType?: DayType | null
}) {
  const create = useCreateDayType()
  const update = useUpdateDayType()
  const mutation = dayType ? update : create
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: values(dayType) })

  useEffect(() => {
    if (open) form.reset(values(dayType))
  }, [dayType, form, open])

  const submit = form.handleSubmit(async (input) => {
    if (dayType) {
      await update.mutateAsync({ ...input, id: dayType.id, version: dayType.version })
    } else {
      await create.mutateAsync(input)
    }
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dayType ? 'Gün tipini düzenle' : 'Yeni gün tipi'}</DialogTitle>
          <DialogDescription>Tekrarlayan gün düzeninin adını ve çizelge rengini belirle.</DialogDescription>
        </DialogHeader>
        <form id="day-type-form" className="mt-6 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-semibold">
            Gün tipi adı
            <input autoFocus className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3" {...form.register('name')} />
            {form.formState.errors.name ? <span role="alert" className="mt-1 block text-xs text-destructive">{form.formState.errors.name.message}</span> : null}
          </label>
          <label className="block text-sm font-semibold">
            Renk
            <input type="color" className="mt-2 h-11 w-28 rounded-xl border border-input bg-background p-1" {...form.register('color')} />
          </label>
          {mutation.error ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button type="submit" form="day-type-form" disabled={mutation.isPending}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function values(dayType?: DayType | null): Values {
  return { name: dayType?.name ?? '', color: dayType?.color ?? '#8B7CFF' }
}
