import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

const EMPTY_VALUE = '__shiftarc_empty__'

export interface SelectOption {
  value: string
  label: string
  description?: string
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Seç',
  ariaLabel,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
  className?: string
}) {
  return (
    <SelectPrimitive.Root
      value={value === '' ? EMPTY_VALUE : value}
      onValueChange={(nextValue) => onValueChange(nextValue === EMPTY_VALUE ? '' : nextValue)}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          'mt-2 flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-input bg-card/65 px-3 text-left text-sm outline-none transition hover:border-primary/35 focus:ring-2 focus:ring-ring/35 data-[placeholder]:text-muted-foreground',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border/80 bg-popover/96 p-1 text-popover-foreground shadow-2xl shadow-black/35 backdrop-blur-xl"
        >
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value === '' ? EMPTY_VALUE : option.value}
                className="relative flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none transition data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground"
              >
                <span className="grid size-4 place-items-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-3.5 text-primary" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                {option.description ? <span className="ml-auto text-xs text-muted-foreground">{option.description}</span> : null}
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
