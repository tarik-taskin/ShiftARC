import { useEffect, useRef, useState } from 'react'
import type { DailyPlan } from '@/api/daily-plan/types'
import { createTimeScale } from './time-scale'
import { formatTime } from '@/features/day-types/time'
import { StatusBadge } from '@/components/ui/page'

const statusNames = { PLANNED: 'Planlandı', ACTIVE: 'Çalışılıyor', COMPLETED: 'Tamamlandı', SKIPPED: 'Atlandı' } as const
export function AdaptiveTimeline({ plan, minute, frozen = false }: { plan: DailyPlan; minute: number; frozen?: boolean }) {
  const [selection, setSelection] = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [anchor, setAnchor] = useState(Math.floor(minute))
  const scroller = useRef<HTMLDivElement>(null)
  const locked = hovered || focused || frozen
  // Updating derived state during render avoids a stale geometry frame.
  if (!locked && anchor !== Math.floor(minute)) setAnchor(Math.floor(minute))
  const scale = createTimeScale(anchor)
  const initialPosition = useRef(scale.position(minute))
  useEffect(() => {
    const node = scroller.current
    if (node && node.scrollWidth > node.clientWidth) node.scrollLeft = node.scrollWidth * initialPosition.current / 100 - node.clientWidth / 3
  }, [])
  const items = plan.blocks.flatMap((block) => block.items.map((item) => ({ ...item, blockName: block.name })))
  const selectedItem = items.find((item) => item.id === selection)
  const selectedBlock = plan.blocks.find((block) => block.id === selection)
  const ticks = Array.from({ length: 25 }, (_, hour) => hour * 60).filter((tick) => (tick >= scale.start && tick <= scale.end) || tick % 180 === 0)
  return <section aria-label="Günlük zaman çizelgesi" className="overflow-hidden rounded-xl border bg-card">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
      <h2 className="font-semibold">Günün akışı</h2><p className="text-xs text-muted-foreground">Ayrıntılı aralık <strong className="font-mono font-medium text-foreground">{formatTime(scale.start)}–{formatTime(scale.end)}</strong></p>
    </div>
    <div ref={scroller} className="timeline-scrollbar overflow-x-auto px-4 pt-4 pb-3" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
      <div className="relative min-w-[920px] pb-2" data-focus-start={scale.start} data-focus-end={scale.end}>
        <div className="pointer-events-none absolute top-7 bottom-2 border-x border-primary/30 bg-primary/5" style={{ left: scale.position(scale.start) + '%', width: '60%' }} />
        <div className="relative h-8 font-mono text-xs text-muted-foreground">{ticks.map((tick) => <span key={tick} className="absolute" style={{ left: scale.position(tick) + '%', transform: tick === 0 ? undefined : tick === 1440 ? 'translateX(-100%)' : 'translateX(-50%)' }}>{formatTime(tick)}</span>)}</div>
        <div className="relative h-14" aria-label="Gün tipi blokları">{plan.blocks.map((block) => {
          const left = scale.position(block.startMinute), width = scale.position(block.endMinute) - left
          return <button key={block.id} type="button" onClick={() => setSelection(block.id)} aria-pressed={selection === block.id} aria-label={block.name + ' · ' + formatTime(block.startMinute) + '–' + formatTime(block.endMinute)} className="absolute inset-y-1 overflow-hidden rounded-md border bg-secondary px-2 text-left text-xs hover:border-primary focus-visible:z-20" style={{ left: left + '%', width: width + '%' }}><span className="block truncate font-medium">{width > 5 ? block.name : ''}</span></button>
        })}</div>
        <div className="relative h-24" aria-label="Planlanan görevler">{items.map((item) => {
          const left = scale.position(item.plannedStartMinute), width = scale.position(item.plannedEndMinute) - left
          const parts = scale.segments(item.plannedStartMinute, item.plannedEndMinute)
          return <button key={item.id} type="button" onClick={() => setSelection(item.id)} aria-pressed={selection === item.id} aria-label={item.taskTitle + ' · ' + formatTime(item.plannedStartMinute) + '–' + formatTime(item.plannedEndMinute) + ' · ' + statusNames[item.status]} className={'absolute inset-y-2 overflow-hidden rounded-md border text-left text-xs focus-visible:z-20 hover:border-primary ' + (item.status === 'ACTIVE' ? 'border-primary bg-accent' : item.status === 'COMPLETED' ? 'border-success/40 bg-success/10' : 'bg-card')} style={{ left: left + '%', width: width + '%' }}>
            {parts.map((part, index) => <span key={index} aria-hidden="true" className="absolute inset-y-0 border-r border-dashed border-border last:border-r-0" style={{ left: (part.left - left) / width * 100 + '%', width: part.width / width * 100 + '%' }} />)}
            {width >= 5 ? <span className="relative block px-2"><span className="line-clamp-2 font-semibold">{item.taskTitle}</span>{width > 10 ? <span className="mt-1 block truncate text-muted-foreground">{item.taskStageTitle ?? statusNames[item.status]}</span> : null}</span> : null}
          </button>
        })}</div>
        <div className="pointer-events-none absolute top-7 bottom-2 z-10 border-l-2 border-primary" style={{ left: scale.position(minute) + '%' }} aria-label="Şu an göstergesi"><span className="absolute -top-1 -left-1.5 size-2.5 rounded-full bg-primary" /></div>
        <div className="flex justify-between pt-1 text-xs text-muted-foreground"><span>00:00 · sıkıştırılmış ölçek</span><span>24:00 · sıkıştırılmış ölçek</span></div>
      </div>
    </div>
    <div className="min-h-20 border-t px-4 py-3" aria-live="polite">
      {selectedItem ? <><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{selectedItem.taskTitle}</h3><StatusBadge tone={selectedItem.status === 'ACTIVE' ? 'info' : selectedItem.status === 'COMPLETED' ? 'success' : 'neutral'}>{statusNames[selectedItem.status]}</StatusBadge></div><p className="mt-1 text-xs text-muted-foreground">{selectedItem.taskStageTitle ? selectedItem.taskStageTitle + ' · ' : ''}{selectedItem.blockName} · {formatTime(selectedItem.plannedStartMinute)}–{formatTime(selectedItem.plannedEndMinute)} · {selectedItem.plannedEndMinute - selectedItem.plannedStartMinute} dk</p></>
      : selectedBlock ? <><h3 className="font-semibold">{selectedBlock.name}</h3><p className="mt-1 text-xs text-muted-foreground">{formatTime(selectedBlock.startMinute)}–{formatTime(selectedBlock.endMinute)} · {selectedBlock.endMinute - selectedBlock.startMinute} dk</p></>
      : <p className="text-sm text-muted-foreground">Bir görev veya blok seçerek ayrıntılarını görüntüle. Yakındaki altı saat daha geniş gösterilir.</p>}
    </div>
  </section>
}
