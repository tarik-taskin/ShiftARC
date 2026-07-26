import * as Popover from '@radix-ui/react-popover'
import { Check, Pipette } from 'lucide-react'

import { cn } from '@/lib/utils'

const palette = [
  '#65E6AA',
  '#8B7CFF',
  '#F59E0B',
  '#FB7185',
  '#38BDF8',
  '#34D399',
  '#A78BFA',
  '#F97316',
  '#4F8CFF',
  '#8B5CF6',
  '#10B981',
  '#EF4444',
]

export function ColorPicker({
  value,
  onChange,
  label = 'Renk seç',
  className,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  className?: string
}) {
  const normalized = value.toUpperCase()

  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        aria-label={label}
        className={cn(
          'mt-2 flex h-11 w-full items-center gap-3 rounded-xl border border-input bg-card/65 px-3 text-sm outline-none transition hover:border-primary/35 focus:ring-2 focus:ring-ring/35',
          className,
        )}
      >
        <span className="size-6 rounded-lg border border-white/25 shadow-[0_0_18px_rgba(255,255,255,.08)]" style={{ backgroundColor: normalized }} />
        <span className="font-mono text-xs text-muted-foreground">{normalized}</span>
        <Pipette className="ml-auto size-4 text-muted-foreground" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} className="z-50 w-72 rounded-2xl border border-border/80 bg-popover/96 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
          <p className="text-sm font-semibold">Renk paleti</p>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {palette.map((color) => (
              <Popover.Close key={color} asChild>
                <button
                  type="button"
                  aria-label={`${color} rengini seç`}
                  onClick={() => onChange(color)}
                  className="grid size-9 place-items-center rounded-xl border border-white/15 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring/35"
                  style={{ backgroundColor: color }}
                >
                  {normalized === color ? <Check className="size-4 text-white drop-shadow" /> : null}
                </button>
              </Popover.Close>
            ))}
          </div>
          <label className="mt-4 block text-xs font-semibold text-muted-foreground">
            Özel hex
            <input
              value={normalized}
              onChange={(event) => onChange(event.target.value.toUpperCase())}
              maxLength={7}
              className="mt-2 h-10 w-full rounded-xl border border-input bg-background/70 px-3 font-mono text-xs outline-none focus:ring-2 focus:ring-ring/35"
              placeholder="#65E6AA"
            />
          </label>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
