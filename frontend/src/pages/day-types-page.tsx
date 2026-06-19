import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Archive, ArchiveRestore, Clock3, Pencil, Plus, Shapes } from 'lucide-react'
import { useState, type MouseEvent } from 'react'

import { useCategories } from '@/api/categories/queries'
import {
  useArchiveDayType,
  useDayTypes,
  useReplaceDayTypeBlocks,
  useRestoreDayType,
} from '@/api/day-types/queries'
import type { DayType, DayTypeBlock } from '@/api/day-types/types'
import { Button } from '@/components/ui/button'
import { DayTypeDialog } from '@/features/day-types/day-type-dialog'
import { formatTime } from '@/features/day-types/time'
import { TimeBlockDialog } from '@/features/day-types/time-block-dialog'

export function DayTypesPage() {
  const [includeArchived, setIncludeArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dayTypeDialogOpen, setDayTypeDialogOpen] = useState(false)
  const [editingDayType, setEditingDayType] = useState<DayType | null>(null)
  const [candidateBlocks, setCandidateBlocks] = useState<DayTypeBlock[] | null>(null)
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null)
  const dayTypes = useDayTypes(includeArchived)
  const categories = useCategories(false, '')
  const replaceBlocks = useReplaceDayTypeBlocks()
  const archive = useArchiveDayType()
  const restore = useRestoreDayType()
  const reduceMotion = useReducedMotion()

  const selected = dayTypes.data?.find((item) => item.id === selectedId)
    ?? dayTypes.data?.[0]
    ?? null
  const effectiveSelectedId = selected?.id ?? null
  const editingBlock = editingBlockIndex === null ? null : candidateBlocks?.[editingBlockIndex] ?? null

  const openCreate = () => {
    setEditingDayType(null)
    setDayTypeDialogOpen(true)
  }

  const openEdit = (dayType: DayType) => {
    setEditingDayType(dayType)
    setDayTypeDialogOpen(true)
  }

  const beginBlockEdit = (blocks: DayTypeBlock[], index: number) => {
    setCandidateBlocks(blocks)
    setEditingBlockIndex(index)
  }

  const splitTimeline = (event: MouseEvent<HTMLDivElement>) => {
    if (!selected || selected.archived) return
    const rect = event.currentTarget.getBoundingClientRect()
    const rawMinute = ((event.clientX - rect.left) / rect.width) * 1440
    const splitMinute = Math.max(5, Math.min(1435, Math.round(rawMinute / 5) * 5))
    const index = selected.blocks.findIndex(
      (block) => splitMinute > block.startMinute && splitMinute < block.endMinute,
    )
    if (index < 0) return
    const original = selected.blocks[index]
    const blocks = [...selected.blocks]
    blocks.splice(
      index,
      1,
      {
        ...original,
        id: crypto.randomUUID(),
        name: 'Plansız',
        endMinute: splitMinute,
        categoryIds: [],
      },
      { ...original, id: crypto.randomUUID(), startMinute: splitMinute },
    )
    beginBlockEdit(blocks, index)
  }

  const saveBlock = async (name: string, categoryIds: string[]) => {
    if (!selected || candidateBlocks === null || editingBlockIndex === null) return
    const blocks = candidateBlocks.map((block, index) =>
      index === editingBlockIndex ? { ...block, name, categoryIds } : block,
    )
    await replaceBlocks.mutateAsync({
      id: selected.id,
      version: selected.version,
      blocks: blocks.map(({ name: blockName, startMinute, endMinute, categoryIds: ids }) => ({
        name: blockName,
        startMinute,
        endMinute,
        categoryIds: ids,
      })),
    })
    closeBlockDialog()
  }

  const deleteBlock = async () => {
    if (!selected || !candidateBlocks || editingBlockIndex === null || candidateBlocks.length < 2) return
    const blocks = [...candidateBlocks]
    if (editingBlockIndex > 0) {
      const previous = blocks[editingBlockIndex - 1]
      const current = blocks[editingBlockIndex]
      blocks.splice(editingBlockIndex - 1, 2, { ...previous, endMinute: current.endMinute })
    } else {
      const current = blocks[0]
      const next = blocks[1]
      blocks.splice(0, 2, { ...next, startMinute: current.startMinute })
    }
    await replaceBlocks.mutateAsync({
      id: selected.id,
      version: selected.version,
      blocks: blocks.map(({ name, startMinute, endMinute, categoryIds }) => ({ name, startMinute, endMinute, categoryIds })),
    })
    closeBlockDialog()
  }

  const closeBlockDialog = () => {
    setEditingBlockIndex(null)
    setCandidateBlocks(null)
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 pt-4 sm:pt-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="section-kicker">Zaman mimarisi</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Gün tipleri</h1>
          <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">Bir günü beş dakikalık hassasiyetle böl; her zaman bloğunun kabul ettiği görev kategorilerini belirle.</p>
        </div>
        <Button onClick={openCreate}><Plus className="size-4" aria-hidden="true" />Yeni gün tipi</Button>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-border/75 bg-card/60 p-4">
          <div className="flex items-center justify-between gap-3 px-1 pb-4">
            <h2 className="font-semibold">Gün düzenleri</h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} /> Arşiv
            </label>
          </div>
          {dayTypes.isPending ? <p role="status" className="p-4 text-sm text-muted-foreground">Gün tipleri yükleniyor…</p> : null}
          {dayTypes.isError ? <Button variant="outline" onClick={() => dayTypes.refetch()}>Yeniden dene</Button> : null}
          <div className="space-y-2">
            {dayTypes.data?.map((dayType) => (
              <button
                key={dayType.id}
                type="button"
                onClick={() => setSelectedId(dayType.id)}
                className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors"
                style={{ borderColor: effectiveSelectedId === dayType.id ? dayType.color : undefined, backgroundColor: effectiveSelectedId === dayType.id ? `${dayType.color}12` : undefined }}
                aria-pressed={effectiveSelectedId === dayType.id}
              >
                <span className="size-3 rounded-full" style={{ backgroundColor: dayType.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{dayType.name}</span>
                  <span className="text-xs text-muted-foreground">{dayType.blocks.length} blok{dayType.archived ? ' · Arşivde' : ''}</span>
                </span>
              </button>
            ))}
          </div>
          {!dayTypes.isPending && !dayTypes.data?.length ? (
            <div className="py-10 text-center">
              <Shapes className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Henüz gün tipi yok</p>
              <Button className="mt-4" size="sm" variant="outline" onClick={openCreate}>İlk düzeni oluştur</Button>
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 rounded-3xl border border-border/75 bg-card/60 p-5 sm:p-7">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0 }}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">24 saatlik şablon</p>
                    <h2 className="mt-2 text-2xl font-semibold">{selected.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Çizelgeye tıklayarak bulunduğun noktadan yeni bir blok sınırı oluştur.</p>
                  </div>
                  <div className="flex gap-2">
                    {!selected.archived ? <Button size="sm" variant="outline" onClick={() => openEdit(selected)}><Pencil className="size-3.5" />Düzenle</Button> : null}
                    {!selected.archived ? (
                      <Button size="sm" variant="ghost" onClick={() => archive.mutate({ id: selected.id, version: selected.version })}><Archive className="size-3.5" />Arşivle</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => restore.mutate({ id: selected.id, version: selected.version })}><ArchiveRestore className="size-3.5" />Geri yükle</Button>
                    )}
                  </div>
                </div>

                <div className="mt-8 overflow-x-auto pb-3">
                  <div className="min-w-[760px]">
                    <div className="mb-2 grid grid-cols-7 text-[10px] font-mono text-muted-foreground">
                      {[0, 4, 8, 12, 16, 20, 24].map((hour) => <span key={hour} className={hour === 24 ? 'text-right' : ''}>{String(hour).padStart(2, '0')}:00</span>)}
                    </div>
                    <div
                      className="flex h-40 cursor-crosshair overflow-hidden rounded-2xl border-2 bg-background/50"
                      style={{ borderColor: `${selected.color}66` }}
                      onClick={splitTimeline}
                      aria-label={`${selected.name} zaman çizelgesi`}
                    >
                      {selected.blocks.map((block, index) => (
                        <div
                          key={block.id}
                          className="group relative flex min-w-0 flex-col justify-between border-r border-background/40 p-3 text-left text-white last:border-r-0"
                          style={{ width: `${((block.endMinute - block.startMinute) / 1440) * 100}%`, backgroundColor: block.name === 'Plansız' ? `${selected.color}55` : selected.color }}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{block.name}</p>
                            <p className="mt-1 font-mono text-[10px] opacity-80">{formatTime(block.startMinute)}–{formatTime(block.endMinute)}</p>
                          </div>
                          <button type="button" className="self-start rounded-lg bg-black/20 px-2 py-1 text-[10px] font-semibold hover:bg-black/30" onClick={(event) => { event.stopPropagation(); beginBlockEdit(selected.blocks, index) }}>Düzenle</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {selected.blocks.map((block, index) => (
                    <button key={block.id} type="button" onClick={() => beginBlockEdit(selected.blocks, index)} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/30 p-4 text-left">
                      <Clock3 className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{block.name}</span><span className="text-xs text-muted-foreground">{formatTime(block.startMinute)}–{formatTime(block.endMinute)} · {block.categoryIds.length} kategori</span></span>
                    </button>
                  ))}
                </div>
                {replaceBlocks.error ? <p role="alert" className="mt-5 text-sm text-destructive">{replaceBlocks.error.message}</p> : null}
              </motion.div>
            ) : (
              <motion.div className="grid min-h-[420px] place-items-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div><Shapes className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">Bir gün tipi seç</h2><p className="mt-2 text-sm text-muted-foreground">Zaman çizelgesini tasarlamak için soldan bir düzen seç veya yenisini oluştur.</p></div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <DayTypeDialog open={dayTypeDialogOpen} onOpenChange={setDayTypeDialogOpen} dayType={editingDayType} />
      <TimeBlockDialog
        key={editingBlock?.id ?? 'closed-block-dialog'}
        block={editingBlock}
        categories={categories.data ?? []}
        open={editingBlock !== null}
        canDelete={(candidateBlocks?.length ?? 0) > 1}
        onOpenChange={(open) => { if (!open) closeBlockDialog() }}
        onSave={saveBlock}
        onDelete={deleteBlock}
      />
    </div>
  )
}
