import { PageHeader, ErrorState } from '@/components/ui/page'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArchiveRestore, Clock3, Copy, Pencil, Plus, Shapes, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { useCategories } from '@/api/categories/queries'
import {
  useDayTypes,
  useDuplicateDayType,
  useReplaceDayTypeBlocks,
  useRestoreDayType,
} from '@/api/day-types/queries'
import type { DayType, DayTypeBlock } from '@/api/day-types/types'
import { Button } from '@/components/ui/button'
import { DayTypeDialog } from '@/features/day-types/day-type-dialog'
import { DayTypeDeleteDialog } from '@/features/day-types/day-type-delete-dialog'
import { DayTypeTimeline } from '@/features/day-types/day-type-timeline'
import { colorForBlock, formatTime } from '@/features/day-types/time'
import { TimeBlockDialog } from '@/features/day-types/time-block-dialog'

export function DayTypesPage() {
  const [includeArchived, setIncludeArchived] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dayTypeDialogOpen, setDayTypeDialogOpen] = useState(false)
  const [editingDayType, setEditingDayType] = useState<DayType | null>(null)
  const [candidateBlocks, setCandidateBlocks] = useState<DayTypeBlock[] | null>(null)
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null)
  const [timelineDraft, setTimelineDraft] = useState<{ dayTypeId: string; blocks: DayTypeBlock[] } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const dayTypes = useDayTypes(includeArchived)
  const categories = useCategories(false, '')
  const replaceBlocks = useReplaceDayTypeBlocks()
  const duplicate = useDuplicateDayType()
  const restore = useRestoreDayType()
  const reduceMotion = useReducedMotion()

  const selected = dayTypes.data?.find((item) => item.id === selectedId)
    ?? dayTypes.data?.[0]
    ?? null
  const effectiveSelectedId = selected?.id ?? null
  const editingBlock = editingBlockIndex === null ? null : candidateBlocks?.[editingBlockIndex] ?? null
  const timelineBlocks = timelineDraft && timelineDraft.dayTypeId === selected?.id
    ? timelineDraft.blocks
    : selected?.blocks ?? []
  const categoryNames = new Map((categories.data ?? []).map((category) => [category.id, category.name]))

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

  const splitTimeline = (rawMinute: number) => {
    if (!selected || selected.archived) return
    const splitMinute = Math.max(5, Math.min(1435, Math.round(rawMinute / 5) * 5))
    const index = timelineBlocks.findIndex(
      (block) => splitMinute > block.startMinute && splitMinute < block.endMinute,
    )
    if (index < 0) return
    const original = timelineBlocks[index]
    const blocks = [...timelineBlocks]
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

  const persistBlocks = async (blocks: DayTypeBlock[]) => {
    if (!selected) return
    await replaceBlocks.mutateAsync({
      id: selected.id,
      version: selected.version,
      blocks: blocks.map(({ name, startMinute, endMinute, categoryIds }) => ({ name, startMinute, endMinute, categoryIds })),
    })
    setTimelineDraft(null)
  }

  const saveBlock = async (name: string, categoryIds: string[], startMinute: number, endMinute: number) => {
    if (!selected || candidateBlocks === null || editingBlockIndex === null) return
    const blocks = candidateBlocks.map((block, index) => {
      if (index === editingBlockIndex) return { ...block, name, categoryIds, startMinute, endMinute }
      if (index === editingBlockIndex - 1) return { ...block, endMinute: startMinute }
      if (index === editingBlockIndex + 1) return { ...block, startMinute: endMinute }
      return block
    })
    await persistBlocks(blocks)
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
    await persistBlocks(blocks)
    closeBlockDialog()
  }

  const closeBlockDialog = () => {
    setEditingBlockIndex(null)
    setCandidateBlocks(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gün tipleri" description="Günün bloklarını ve her bloğa uygun kategorileri düzenle." actions={<Button onClick={openCreate}><Plus className="size-4" />Yeni gün tipi</Button>} />

      <div className="grid gap-6 xl:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="self-start rounded-xl border border-border/75 bg-card p-4 xl:sticky xl:top-24">
          <div className="flex items-center justify-between gap-3 px-1 pb-4">
            <h2 className="font-semibold">Gün düzenleri</h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} /> Arşiv
            </label>
          </div>
          {dayTypes.isPending ? <p role="status" className="p-4 text-sm text-muted-foreground">Gün tipleri yükleniyor…</p> : null}
          {dayTypes.isError ? <ErrorState title="Gün tipleri yüklenemedi" retry={() => dayTypes.refetch()} /> : null}
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {dayTypes.data?.map((dayType) => (
              <button
                key={dayType.id}
                type="button"
                onClick={() => { setSelectedId(dayType.id); setTimelineDraft(null) }}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
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
          {!dayTypes.isPending && !dayTypes.isError && !dayTypes.data?.length ? (
            <div className="py-10 text-center">
              <Shapes className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Henüz gün tipi yok</p>
              <Button className="mt-4" size="sm" variant="outline" onClick={openCreate}>İlk düzeni oluştur</Button>
            </div>
          ) : null}
        </aside>

        <section className="min-w-0 rounded-xl border border-border/75 bg-card p-4 sm:p-5">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">24 saatlik şablon</p>
                    <h2 className="mt-2 text-2xl font-semibold">{selected.name}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Çizelgeye tıklayarak bulunduğun noktadan yeni bir blok sınırı oluştur.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!selected.archived ? <Button size="sm" variant="outline" onClick={() => openEdit(selected)}><Pencil className="size-3.5" />Düzenle</Button> : null}
                    <Button size="sm" variant="outline" onClick={() => duplicate.mutate({ id: selected.id })} disabled={duplicate.isPending}><Copy className="size-3.5" />Kopyala</Button>
                    {selected.archived ? (
                      <Button size="sm" variant="ghost" onClick={() => restore.mutate({ id: selected.id, version: selected.version })}><ArchiveRestore className="size-3.5" />Geri yükle</Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialogOpen(true)}><Trash2 className="size-3.5" />Sil</Button>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <DayTypeTimeline
                    dayType={selected}
                    blocks={timelineBlocks}
                    disabled={selected.archived || replaceBlocks.isPending}
                    onBlocksChange={(blocks) => setTimelineDraft({ dayTypeId: selected.id, blocks })}
                    onCommit={persistBlocks}
                    onEdit={(index) => beginBlockEdit(timelineBlocks, index)}
                    onSplit={splitTimeline}
                  />
                </div>

                <div className="mt-5 grid gap-2">
                  {timelineBlocks.map((block, index) => (
                    <button key={block.id} type="button" onClick={() => beginBlockEdit(timelineBlocks, index)} className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/30 p-4 text-left transition-colors hover:border-primary/35 hover:bg-background/50">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg text-foreground border" style={{ borderColor: colorForBlock(index, block.name === 'Plansız') }}><Clock3 className="size-4" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{block.name}</span><span className="line-clamp-2 text-xs text-muted-foreground">{formatTime(block.startMinute)}–{formatTime(block.endMinute)} · {block.categoryIds.map((id) => categoryNames.get(id)).filter(Boolean).join(', ') || 'Kategori yok'}</span></span>
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
        </section>
      </div>

      <DayTypeDialog open={dayTypeDialogOpen} onOpenChange={setDayTypeDialogOpen} dayType={editingDayType} />
      {selected ? <DayTypeDeleteDialog dayType={selected} open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onDeleted={() => { setSelectedId(null); setTimelineDraft(null) }} /> : null}
      <TimeBlockDialog
        key={editingBlock?.id ?? 'closed-block-dialog'}
        block={editingBlock}
        categories={categories.data ?? []}
        open={editingBlock !== null}
        canDelete={(candidateBlocks?.length ?? 0) > 1}
        minimumStart={editingBlockIndex !== null && editingBlockIndex > 0 ? (candidateBlocks?.[editingBlockIndex - 1]?.startMinute ?? 0) + 5 : null}
        maximumEnd={editingBlockIndex !== null && candidateBlocks && editingBlockIndex < candidateBlocks.length - 1 ? candidateBlocks[editingBlockIndex + 1].endMinute - 5 : null}
        onOpenChange={(open) => { if (!open) closeBlockDialog() }}
        onSave={saveBlock}
        onDelete={deleteBlock}
      />
    </div>
  )
}
