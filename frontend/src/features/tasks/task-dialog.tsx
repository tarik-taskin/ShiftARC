import { Plus } from 'lucide-react'
import { useState } from 'react'

import { useCategories } from '@/api/categories/queries'
import { useCreateTask, useUpdateTask } from '@/api/tasks/queries'
import type { Task, TaskType } from '@/api/tasks/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CategoryDialog } from '@/features/categories/category-dialog'

export function TaskDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (open: boolean) => void; task?: Task | null }) {
  const [type, setType] = useState<TaskType>(task?.type ?? 'WORK_ITEM')
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [importance, setImportance] = useState(task?.importance ?? 3)
  const [minutes, setMinutes] = useState(task?.totalRequiredMinutes ?? task?.weeklyTargetMinutes ?? 60)
  const [deadline, setDeadline] = useState(task?.deadline ?? '')
  const [categoryIds, setCategoryIds] = useState(task?.categories.map((category) => category.id) ?? [])
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const categories = useCategories(false, '')
  const create = useCreateTask()
  const update = useUpdateTask()
  const mutation = task ? update : create
  const valid = title.trim() && minutes > 0 && minutes % 5 === 0 && (type === 'HABIT' || deadline)

  const submit = async () => {
    const input = {
      type, title: title.trim(), description: description.trim() || null, importance,
      totalRequiredMinutes: type === 'WORK_ITEM' ? minutes : null,
      deadline: type === 'WORK_ITEM' ? deadline : null,
      weeklyTargetMinutes: type === 'HABIT' ? minutes : null,
      categoryIds,
    }
    if (task) await update.mutateAsync({ ...input, id: task.id, version: task.version })
    else await create.mutateAsync(input)
    onOpenChange(false)
  }

  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{task ? 'Görevi düzenle' : 'Yeni görev'}</DialogTitle><DialogDescription>İş parçacığını veya tekrarlayan alışkanlığı planlama motoruna tanıt.</DialogDescription></DialogHeader>
        <div className="mt-5 max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Görev tipi">
            {([['WORK_ITEM', 'İş parçacığı'], ['HABIT', 'Alışkanlık']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className="rounded-xl border p-3 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-primary/10">{label}</button>)}
          </div>
          <label className="block text-sm font-semibold">Başlık<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3" /></label>
          <label className="block text-sm font-semibold">Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-input bg-background/60 p-3" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Önem: {importance}/5<input aria-label="Önem" type="range" min="1" max="5" value={importance} onChange={(event) => setImportance(Number(event.target.value))} className="mt-3 w-full" /></label>
            <label className="text-sm font-semibold">{type === 'WORK_ITEM' ? 'Toplam süre (dakika)' : 'Haftalık hedef (dakika)'}<input type="number" min="5" step="5" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3" /></label>
          </div>
          {type === 'WORK_ITEM' ? <label className="block text-sm font-semibold">Son teslim tarihi<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3" /></label> : null}
          <fieldset><div className="flex items-center justify-between"><legend className="text-sm font-semibold">Kategoriler</legend><Button type="button" size="sm" variant="ghost" onClick={() => setCategoryDialogOpen(true)}><Plus className="size-3.5" />Yeni kategori</Button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{categories.data?.map((category) => <label key={category.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={() => setCategoryIds((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])} /><span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</label>)}</div></fieldset>
          {mutation.error ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button><Button disabled={!valid || mutation.isPending} onClick={submit}>{mutation.isPending ? 'Kaydediliyor…' : 'Görevi kaydet'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
  </>
}
