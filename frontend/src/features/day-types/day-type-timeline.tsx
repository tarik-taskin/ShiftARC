import { GripVertical, Pencil } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

import type { DayType, DayTypeBlock } from '@/api/day-types/types'
import { Button } from '@/components/ui/button'
import { colorForBlock, formatTime } from '@/features/day-types/time'

export function DayTypeTimeline({
  dayType,
  blocks,
  disabled,
  onBlocksChange,
  onCommit,
  onEdit,
  onSplit,
}: {
  dayType: DayType
  blocks: DayTypeBlock[]
  disabled: boolean
  onBlocksChange: (blocks: DayTypeBlock[]) => void
  onCommit: (blocks: DayTypeBlock[]) => void
  onEdit: (index: number) => void
  onSplit: (minute: number) => void
}) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const blocksRef = useRef(blocks)
  const dragStartRef = useRef<number | null>(null)
  const [draggingBoundary, setDraggingBoundary] = useState<number | null>(null)

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  const updateBoundary = (index: number, minute: number) => {
    const current = blocksRef.current
    const previous = current[index]
    const next = current[index + 1]
    const boundary = Math.max(
      previous.startMinute + 5,
      Math.min(next.endMinute - 5, Math.round(minute / 5) * 5),
    )
    const updated = current.map((block, blockIndex) => {
      if (blockIndex === index) return { ...block, endMinute: boundary }
      if (blockIndex === index + 1) return { ...block, startMinute: boundary }
      return block
    })
    blocksRef.current = updated
    onBlocksChange(updated)
  }

  const minuteAtPointer = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return ((clientX - rect.left) / rect.width) * 1440
  }

  const startDrag = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartRef.current = blocksRef.current[index].endMinute
    setDraggingBoundary(index)
  }

  const moveDrag = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (draggingBoundary !== index) return
    updateBoundary(index, minuteAtPointer(event.clientX))
  }

  const finishDrag = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (draggingBoundary !== index) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    setDraggingBoundary(null)
    if (dragStartRef.current !== blocksRef.current[index].endMinute) {
      onCommit(blocksRef.current)
    }
    dragStartRef.current = null
  }

  const adjustWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const direction = event.key === 'ArrowLeft' ? -1 : 1
    const step = event.shiftKey ? 15 : 5
    updateBoundary(index, blocksRef.current[index].endMinute + direction * step)
    onCommit(blocksRef.current)
  }

  return (
    <div className="timeline-scrollbar overflow-x-auto rounded-2xl border border-border/70 bg-background/35 p-3 pb-4">
      <div className="min-w-[1080px]">
        <div className="mb-2 grid grid-cols-25 px-1 font-mono text-[10px] text-muted-foreground">
          {Array.from({ length: 25 }, (_, hour) => (
            <span key={hour} className={hour === 24 ? 'text-right' : ''}>
              {String(hour).padStart(2, '0')}
            </span>
          ))}
        </div>
        <div
          ref={timelineRef}
          className={`relative flex h-56 overflow-hidden rounded-xl border-2 ${disabled ? 'cursor-default' : 'cursor-crosshair'}`}
          style={{ borderColor: `${dayType.color}80` }}
          aria-label={`${dayType.name} zaman çizelgesi`}
        >
          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] bg-[length:60px_100%]" />
          {blocks.map((block, index) => {
            const duration = block.endMinute - block.startMinute
            const color = colorForBlock(index, block.name === 'Plansız')
            return (
              <div
                key={block.id}
                className="group relative min-w-0 shrink-0 border-r border-black/25 p-3 text-white last:border-r-0"
                style={{ width: `${(duration / 1440) * 100}%`, backgroundColor: color }}
                title={`${block.name} · ${formatTime(block.startMinute)}–${formatTime(block.endMinute)}`}
                onClick={(event) => {
                  if (!disabled) onSplit(minuteAtPointer(event.clientX))
                }}
              >
                <div className="pointer-events-none relative z-20 flex h-full w-full flex-col items-start text-left">
                  {duration >= 45 ? (
                    <>
                      <span className="max-w-full truncate text-sm font-bold">{block.name}</span>
                      <span className="mt-1 whitespace-nowrap font-mono text-[10px] text-white/80">
                        {formatTime(block.startMinute)}–{formatTime(block.endMinute)}
                      </span>
                    </>
                  ) : (
                    <span className="sr-only">{block.name}</span>
                  )}
                  {duration >= 90 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="pointer-events-auto mt-auto h-7 bg-black/20 px-2 text-[10px] text-white hover:bg-black/35 hover:text-white"
                      onClick={(event) => {
                        event.stopPropagation()
                        onEdit(index)
                      }}
                    ><Pencil className="size-3" /> Düzenle</Button>
                  ) : null}
                </div>
                {index < blocks.length - 1 ? (
                  <button
                    type="button"
                    className={`absolute top-0 right-0 z-30 flex h-full w-4 translate-x-1/2 touch-none items-center justify-center border-x border-white/30 bg-black/20 text-white shadow-lg hover:w-5 hover:bg-black/45 focus-visible:w-5 focus-visible:bg-black/50 focus-visible:outline-none ${draggingBoundary === index ? 'w-6 bg-black/55' : ''}`}
                    aria-label={`${block.name} ve ${blocks[index + 1].name} sınırını sürükle`}
                    aria-valuemin={block.startMinute + 5}
                    aria-valuemax={blocks[index + 1].endMinute - 5}
                    aria-valuenow={block.endMinute}
                    role="slider"
                    onPointerDown={(event) => startDrag(event, index)}
                    onPointerMove={(event) => moveDrag(event, index)}
                    onPointerUp={(event) => finishDrag(event, index)}
                    onPointerCancel={(event) => finishDrag(event, index)}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => adjustWithKeyboard(event, index)}
                  >
                    <GripVertical className="size-3" />
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
        <p className="mt-3 px-1 text-xs text-muted-foreground">
          Boş alana tıklayarak blok ekle. Sınır tutamaçlarını sürükle veya ok tuşlarıyla 5 dakika değiştir; Shift ile 15 dakika ilerle.
        </p>
      </div>
    </div>
  )
}
