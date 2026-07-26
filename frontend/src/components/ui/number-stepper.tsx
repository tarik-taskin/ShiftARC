import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

interface NumberStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  ariaLabel: string
  className?: string
}

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  ariaLabel,
  className,
}: NumberStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  return (
    <div
      className={cn(
        'mt-2 flex h-11 w-full items-center overflow-hidden rounded-xl border border-input bg-card/65 text-sm shadow-inner shadow-black/10 transition focus-within:ring-2 focus-within:ring-ring/35',
        className,
      )}
    >
      <button
        type="button"
        aria-label={`${ariaLabel} azalt`}
        className="grid h-full w-11 place-items-center border-r border-border/70 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step))}
      >
        <Minus className="size-3.5" />
      </button>
      <input
        role="spinbutton"
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Number.isFinite(value) ? value : min}
        inputMode="numeric"
        value={Number.isFinite(value) ? value : ''}
        onChange={(event) => {
          const next = Number(event.target.value)
          onChange(Number.isFinite(next) ? clamp(next) : min)
        }}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-center font-mono outline-none"
      />
      <button
        type="button"
        aria-label={`${ariaLabel} artır`}
        className="grid h-full w-11 place-items-center border-l border-border/70 text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step))}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
