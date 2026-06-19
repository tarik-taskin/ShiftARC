import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'grid size-9 place-items-center rounded-xl border border-primary/25 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]',
        className,
      )}
      aria-hidden="true"
    >
      <span className="relative size-4 rotate-[-35deg] rounded-full border-2 border-primary border-l-transparent after:absolute after:-right-1 after:-bottom-1 after:size-1 after:rounded-full after:bg-primary after:content-['']" />
    </span>
  )
}
