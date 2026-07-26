import { Archive, Check, Lightbulb, ListTodo, Pencil, Plus, RotateCcw, Search, Sparkles, Timer } from 'lucide-react'
import { useDeferredValue, useState } from 'react'

import { useCategories } from '@/api/categories/queries'
import { useSetTaskStatus, useTasks } from '@/api/tasks/queries'
import type { Task, TaskStatus, TaskType } from '@/api/tasks/types'
import { Button } from '@/components/ui/button'
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

  return <div className="space-y-8">
    <section className="flex flex-col gap-6 pt-4 sm:pt-8 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="section-kicker">Görev merkezi</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">İşler, alışkanlıklar ve fırsatlar.</h1><p className="mt-5 max-w-2xl leading-7 text-muted-foreground">Son tarihli işleri, haftalık hedefli alışkanlıkları ve boş kapasitede ele alınacak fırsatları yönet.</p></div><Button onClick={openCreate}><Plus className="size-4" />Yeni görev</Button></section>
    <section className="rounded-3xl border border-border/75 bg-card/60 p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <label className="relative"><span className="sr-only">Görevlerde ara</span><Search className="absolute top-3 left-3 size-4 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Görev ara…" className="h-10 w-full rounded-xl border bg-background/60 pr-3 pl-9" /></label>
      <Filter label="Görev tipi" value={type} onChange={setType} options={[['', 'Tüm tipler'], ['WORK_ITEM', 'İş parçacıkları'], ['HABIT', 'Alışkanlıklar'], ['OPPORTUNITY', 'Fırsatlar']]} />
      <Filter label="Durum" value={status} onChange={setStatus} options={[['', 'Tüm durumlar'], ['ACTIVE', 'Aktif'], ['COMPLETED', 'Tamamlanan'], ['ARCHIVED', 'Arşivlenen']]} />
      <label><span className="sr-only">Kategori</span><select aria-label="Kategori" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm"><option value="">Tüm kategoriler</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <Filter label="Sıralama" value={sort} onChange={setSort} options={[['PRIORITY', 'Öneme göre'], ['DEADLINE', 'Son tarihe göre'], ['CREATED', 'En yeni']]} />
    </div></section>
    {tasks.isPending ? <div role="status" className="py-20 text-center">Görevler yükleniyor…</div> : null}
    {tasks.isError ? <div className="py-20 text-center"><p>Görevler yüklenemedi</p><Button className="mt-4" variant="outline" onClick={() => tasks.refetch()}>Yeniden dene</Button></div> : null}
    {!tasks.isPending && !tasks.data?.length ? <div className="rounded-3xl border border-dashed py-20 text-center"><ListTodo className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-4 font-semibold">Bu görünümde görev yok</h2><Button className="mt-5" variant="outline" onClick={openCreate}>İlk görevi oluştur</Button></div> : null}
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tasks.data?.map((task) => <TaskCard key={task.id} task={task} onEdit={() => openEdit(task)} onStatus={(nextStatus) => setTaskStatus.mutate({ id: task.id, version: task.version, status: nextStatus })} />)}</section>
    <TaskDialog key={editing?.id ?? 'new-task'} open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />
  </div>
}

function TaskCard({ task, onEdit, onStatus }: { task: Task; onEdit: () => void; onStatus: (status: TaskStatus) => void }) {
  const target = task.type === 'WORK_ITEM' ? task.totalRequiredMinutes ?? 0 : task.type === 'HABIT' ? task.weeklyTargetMinutes ?? 0 : 0
  const progress = target ? Math.min(100, (task.executedMinutes / target) * 100) : 0
  const Icon = task.type === 'WORK_ITEM' ? Timer : task.type === 'HABIT' ? Sparkles : Lightbulb
  const activeStage = task.stages.find((stage) => !stage.completed)
  return <article className="rounded-3xl border border-border/75 bg-card/55 p-5"><div className="flex items-start justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary"><Icon className="size-3" />{taskTypeLabels[task.type]}</span><span className="text-xs text-amber-400">{'★'.repeat(task.importance)}<span className="text-muted">{'★'.repeat(5 - task.importance)}</span></span></div><h2 className="mt-4 text-lg font-semibold">{task.title}</h2>{activeStage ? <p className="mt-1 text-sm text-primary">{activeStage.title}</p> : null}{task.description ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{task.description}</p> : null}<div className="mt-4 flex flex-wrap gap-2">{task.categories.map((category) => <span key={category.id} className="rounded-full border px-2 py-1 text-[10px]" style={{ borderColor: `${category.color}88` }}>{category.name}</span>)}{!task.categories.length ? <span className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground">Kategorisiz</span> : null}</div><div className="mt-5 rounded-2xl bg-background/35 p-3 text-sm">{target ? <><div className="flex justify-between gap-3"><p className="font-semibold">{task.remainingMinutes} dakika kaldı</p><p className="text-xs text-muted-foreground">{task.executedMinutes}/{target} dk</p></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></> : <p className="text-sm text-muted-foreground">Hedefsiz fırsat · uygun boşluklarda planlanır</p>}{task.dailyLimitMinutes ? <p className="mt-2 text-xs text-muted-foreground">Günlük limit: {task.dailyLimitMinutes} dk</p> : null}{task.deadline ? <p className="mt-2 text-xs text-muted-foreground">Son tarih: {new Intl.DateTimeFormat('tr-TR').format(new Date(`${task.deadline}T12:00:00`))}</p> : null}</div><div className="mt-4 flex flex-wrap justify-end gap-1 border-t pt-3"><Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="size-3.5" />Düzenle</Button>{task.status === 'ACTIVE' ? <><Button size="sm" variant="ghost" onClick={() => onStatus('COMPLETED')}><Check className="size-3.5" />Tamamla</Button><Button size="sm" variant="ghost" onClick={() => onStatus('ARCHIVED')}><Archive className="size-3.5" />Arşivle</Button></> : <Button size="sm" variant="ghost" onClick={() => onStatus('ACTIVE')}><RotateCcw className="size-3.5" />Aktifleştir</Button>}</div></article>
}

function Filter<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: ReadonlyArray<readonly [T, string]> }) { return <label><span className="sr-only">{label}</span><select className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm" aria-label={label} value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></label> }
