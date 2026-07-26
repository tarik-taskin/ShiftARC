import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useCategories } from '@/api/categories/queries'
import { useCreateTask, useUpdateTask } from '@/api/tasks/queries'
import type { Task, TaskType } from '@/api/tasks/types'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-time-picker'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NumberStepper } from '@/components/ui/number-stepper'
import { CategoryDialog } from '@/features/categories/category-dialog'

const typeLabels: Record<TaskType, string> = {
  WORK_ITEM: 'İş parçacığı',
  HABIT: 'Alışkanlık',
  OPPORTUNITY: 'Fırsat',
}

export function TaskDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (open: boolean) => void; task?: Task | null }) {
  const [type, setType] = useState<TaskType>(task?.type ?? 'WORK_ITEM')
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [importance, setImportance] = useState(task?.importance ?? 3)
  const [minutes, setMinutes] = useState(task?.totalRequiredMinutes ?? task?.weeklyTargetMinutes ?? 60)
  const [dailyLimitMinutes, setDailyLimitMinutes] = useState(task?.dailyLimitMinutes ?? 0)
  const [deadline, setDeadline] = useState(task?.deadline ?? '')
  const [stages, setStages] = useState<Array<{ title: string; completed: boolean }>>(task?.stages.map((stage) => ({ title: stage.title, completed: stage.completed })) ?? [])
  const [categoryIds, setCategoryIds] = useState(task?.categories.map((category) => category.id) ?? [])
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const categories = useCategories(false, '')
  const create = useCreateTask()
  const update = useUpdateTask()
  const mutation = task ? update : create
  const needsMinutes = type !== 'OPPORTUNITY'
  const validMinutes = !needsMinutes || (minutes > 0 && minutes % 5 === 0)
  const validLimit = dailyLimitMinutes === 0 || (dailyLimitMinutes > 0 && dailyLimitMinutes % 5 === 0)
  const valid = Boolean(title.trim()) && validMinutes && validLimit && (type !== 'WORK_ITEM' || Boolean(deadline))

  const submit = async () => {
    const input = {
      type,
      title: title.trim(),
      description: description.trim() || null,
      importance,
      totalRequiredMinutes: type === 'WORK_ITEM' ? minutes : null,
      deadline: type === 'WORK_ITEM' ? deadline : null,
      weeklyTargetMinutes: type === 'HABIT' ? minutes : null,
      dailyLimitMinutes: dailyLimitMinutes > 0 ? dailyLimitMinutes : null,
      stages: stages.map((stage) => ({ title: stage.title.trim(), completed: stage.completed })).filter((stage) => stage.title),
      categoryIds,
    }
    if (task) await update.mutateAsync({ ...input, id: task.id, version: task.version })
    else await create.mutateAsync(input)
    onOpenChange(false)
  }

  const updateStage = (index: number, value: string) => {
    setStages((current) => current.map((stage, stageIndex) => stageIndex === index ? { ...stage, title: value } : stage))
  }

  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Görevi düzenle' : 'Yeni görev'}</DialogTitle>
          <DialogDescription>İş parçacığını, tekrarlayan alışkanlığı veya boş kapasitede ele alınacak fırsatı planlama motoruna tanıt.</DialogDescription>
        </DialogHeader>
        <div className="mt-5 max-h-[68vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Görev tipi">
            {(Object.keys(typeLabels) as TaskType[]).map((value) => (
              <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className="rounded-xl border p-3 text-sm font-semibold aria-pressed:border-primary aria-pressed:bg-primary/10">
                {typeLabels[value]}
              </button>
            ))}
          </div>
          <label className="block text-sm font-semibold">Başlık<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3" /></label>
          <label className="block text-sm font-semibold">Açıklama<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-input bg-background/60 p-3" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Önem: {importance}/5<input aria-label="Önem" type="range" min="1" max="5" value={importance} onChange={(event) => setImportance(Number(event.target.value))} className="mt-3 w-full" /></label>
            {needsMinutes ? (
              <label className="text-sm font-semibold">
                {type === 'WORK_ITEM' ? 'Toplam süre (dakika)' : 'Haftalık hedef (dakika)'}
                <NumberStepper value={minutes} onChange={setMinutes} min={5} step={5} ariaLabel={type === 'WORK_ITEM' ? 'Toplam süre' : 'Haftalık hedef'} />
              </label>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-background/35 p-3 text-sm text-muted-foreground">Fırsatlar hedef süre istemez; yalnız diğer işler bittikten sonra kalan uygun zamanlara yerleşir.</div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {type === 'WORK_ITEM' ? (
              <label className="block text-sm font-semibold">
                Son teslim tarihi
                <DatePicker value={deadline} onChange={setDeadline} label="Son teslim tarihi" />
              </label>
            ) : null}
            <label className="block text-sm font-semibold">
              Günlük limit (opsiyonel)
              <NumberStepper value={dailyLimitMinutes} onChange={setDailyLimitMinutes} min={0} step={5} ariaLabel="Günlük limit" />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">0 bırakırsan limit uygulanmaz.</span>
            </label>
          </div>
          <fieldset className="rounded-2xl border border-border/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <legend className="text-sm font-semibold">Sıralı aşamalar</legend>
              <Button type="button" size="sm" variant="ghost" onClick={() => setStages((current) => [...current, { title: '', completed: false }])}><Plus className="size-3.5" />Aşama ekle</Button>
            </div>
            <div className="mt-3 space-y-2">
              {stages.map((stage, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-border/60 bg-background/30 p-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={stage.completed} onChange={(event) => setStages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, completed: event.target.checked } : item))} />Tamam</label>
                  <input value={stage.title} onChange={(event) => updateStage(index, event.target.value)} placeholder={`${index + 1}. aşama`} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
                  <Button type="button" size="sm" variant="ghost" aria-label="Aşamayı sil" onClick={() => setStages((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-3.5" /></Button>
                </div>
              ))}
              {!stages.length ? <p className="text-sm text-muted-foreground">Aşama eklemezsen görev tek başlıkla planlanır.</p> : null}
            </div>
          </fieldset>
          <fieldset><div className="flex items-center justify-between"><legend className="text-sm font-semibold">Kategoriler</legend><Button type="button" size="sm" variant="ghost" onClick={() => setCategoryDialogOpen(true)}><Plus className="size-3.5" />Yeni kategori</Button></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{categories.data?.map((category) => <label key={category.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={() => setCategoryIds((current) => current.includes(category.id) ? current.filter((id) => id !== category.id) : [...current, category.id])} /><span className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</label>)}</div></fieldset>
          {mutation.error ? <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p> : null}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button><Button disabled={!valid || mutation.isPending} onClick={submit}>{mutation.isPending ? 'Kaydediliyor…' : 'Görevi kaydet'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <CategoryDialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen} />
  </>
}
