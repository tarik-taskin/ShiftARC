import { PageHeader, EmptyState, ErrorState, StatusBadge } from '@/components/ui/page'
import { Archive, Check, Pencil, Plus, RotateCcw, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'

import { useCategories } from '@/api/categories/queries'
import { useSetTaskStatus, useTasks } from '@/api/tasks/queries'
import type { Task, TaskStatus, TaskType } from '@/api/tasks/types'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { TaskDialog } from '@/features/tasks/task-dialog'

const taskTypeLabels: Record<TaskType, string> = {
  WORK_ITEM: 'İş parçacığı',
  HABIT: 'Alışkanlık',
  OPPORTUNITY: 'Fırsat',
}

export function TasksPage() {
  const [type, setType] = useState<TaskType | ''>('')
  const [status, setStatus] = useState<TaskStatus | ''>('ACTIVE')
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'PRIORITY' | 'DEADLINE' | 'CREATED'>('PRIORITY')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const deferredSearch = useDeferredValue(search.trim())
  const tasks = useTasks({ type, status, categoryId, search: deferredSearch, sort })
  const categories = useCategories(false, '')
  const setTaskStatus = useSetTaskStatus()

  const openCreate = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (task: Task) => { setEditing(task); setDialogOpen(true) }

  return <div className="space-y-6">
    <PageHeader title="Görevler" description="İşlerini, alışkanlıklarını ve fırsatlarını tek yerde düzenle." actions={<Button onClick={openCreate}><Plus className="size-4" />Yeni görev</Button>} />
    <section className="rounded-xl border border-border/75 bg-card p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <label className="relative"><span className="sr-only">Görevlerde ara</span><Search className="absolute top-3 left-3 size-4 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Görev ara…" className="h-10 w-full rounded-xl border bg-background/60 pr-3 pl-9" /></label>
      <Filter label="Görev tipi" value={type} onChange={(value) => setType(value as TaskType | '')} options={[['', 'Tüm tipler'], ['WORK_ITEM', 'İş parçacıkları'], ['HABIT', 'Alışkanlıklar'], ['OPPORTUNITY', 'Fırsatlar']]} />
      <Filter label="Durum" value={status} onChange={(value) => setStatus(value as TaskStatus | '')} options={[['', 'Tüm durumlar'], ['ACTIVE', 'Aktif'], ['COMPLETED', 'Tamamlanan'], ['ARCHIVED', 'Arşivlenen']]} />
      <Filter label="Kategori" value={categoryId} onChange={setCategoryId} options={[['', 'Tüm kategoriler'], ...(categories.data?.map((category) => [category.id, category.name] as const) ?? [])]} />
      <Filter label="Sıralama" value={sort} onChange={(value) => setSort(value as 'PRIORITY' | 'DEADLINE' | 'CREATED')} options={[['PRIORITY', 'Öneme göre'], ['DEADLINE', 'Son tarihe göre'], ['CREATED', 'En yeni']]} />
    </div></section>
    {tasks.isPending ? <div role="status" className="py-20 text-center">Görevler yükleniyor…</div> : null}
    {tasks.isError ? <ErrorState title="Görevler yüklenemedi" retry={() => tasks.refetch()} /> : null}
    {!tasks.isPending && !tasks.isError && !tasks.data?.length ? <EmptyState title="Bu görünümde görev yok" description="Yeni bir görev ekle veya filtrelerini değiştir." action={<Button variant="outline" onClick={openCreate}>İlk görevi oluştur</Button>} /> : null}
    {setTaskStatus.error ? <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-destructive">{setTaskStatus.error.message}</p> : null}
    <section aria-label="Görev listesi" className="space-y-2">{tasks.data?.map((task) => <TaskRow key={task.id} task={task} pending={setTaskStatus.isPending} onEdit={() => openEdit(task)} onStatus={(nextStatus) => setTaskStatus.mutate({ id: task.id, version: task.version, status: nextStatus })} />)}</section>
    <TaskDialog key={editing?.id ?? 'new-task'} open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />
  </div>
}

function TaskRow({ task, pending, onEdit, onStatus }: { task: Task; pending: boolean; onEdit: () => void; onStatus: (status: TaskStatus) => void }) {
  const target = task.type === 'WORK_ITEM' ? task.totalRequiredMinutes ?? 0 : task.type === 'HABIT' ? task.weeklyTargetMinutes ?? 0 : 0
  const progress = target ? Math.min(100, task.executedMinutes / target * 100) : 0
  const activeStage = task.stages.find((stage) => !stage.completed)
  return <article className="rounded-xl border bg-card p-4">
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><StatusBadge>{taskTypeLabels[task.type]}</StatusBadge><span className="text-xs text-muted-foreground">Önem {task.importance}/5</span>{task.status !== 'ACTIVE' ? <StatusBadge tone={task.status === 'COMPLETED' ? 'success' : 'neutral'}>{task.status === 'COMPLETED' ? 'Tamamlandı' : 'Arşivde'}</StatusBadge> : null}</div><h2 className="break-words text-base font-semibold">{task.title}</h2>{activeStage ? <p className="mt-1 text-sm text-primary">{activeStage.title}</p> : null}{task.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{task.description}</p> : null}</div>
      <div><p className="mb-2 text-xs text-muted-foreground">Kategoriler</p><div className="flex flex-wrap gap-1.5">{task.categories.length ? task.categories.map((category) => <span key={category.id} className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs"><span className="size-2 shrink-0 rounded-full" style={{ background: category.color }} /><span className="truncate">{category.name}</span></span>) : <span className="text-sm text-muted-foreground">Kategorisiz</span>}</div></div>
      <div><p className="mb-2 text-xs text-muted-foreground">Süre</p>{target ? <><p className="text-sm font-medium">{task.remainingMinutes} dakika kaldı</p><p className="mt-1 text-xs text-muted-foreground">{task.executedMinutes}/{target} dk</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={task.title + ' süre hedefi'} aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-primary" style={{ width: progress + '%' }} /></div></> : <p className="text-sm text-muted-foreground">Uygun boşluklarda</p>}{task.dailyLimitMinutes ? <p className="mt-2 text-xs text-muted-foreground">Günlük limit: {task.dailyLimitMinutes} dk</p> : null}</div>
      <div><p className="mb-2 text-xs text-muted-foreground">Son tarih</p><p className="text-sm">{task.deadline ? new Intl.DateTimeFormat('tr-TR').format(new Date(task.deadline + 'T12:00:00')) : '—'}</p></div>
    </div>
    <div className="mt-3 flex flex-wrap justify-end gap-1 border-t pt-2"><Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="size-3.5" />Düzenle</Button>{task.status === 'ACTIVE' ? <><Button size="sm" variant="ghost" disabled={pending} onClick={() => onStatus('COMPLETED')}><Check className="size-3.5" />Tamamla</Button><Button size="sm" variant="ghost" disabled={pending} onClick={() => onStatus('ARCHIVED')}><Archive className="size-3.5" />Arşivle</Button></> : <Button size="sm" variant="ghost" disabled={pending} onClick={() => onStatus('ACTIVE')}><RotateCcw className="size-3.5" />Aktifleştir</Button>}</div>
  </article>
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<readonly [string, string]> }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <Select className="mt-0 h-10" ariaLabel={label} value={value} onValueChange={onChange} options={options.map(([optionValue, text]) => ({ value: optionValue, label: text }))} />
    </label>
  )
}
