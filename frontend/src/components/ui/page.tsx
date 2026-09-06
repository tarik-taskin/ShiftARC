import type { ComponentProps, ReactNode } from 'react'
import { AlertCircle, Inbox } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0"><h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}</div>
    {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
  </header>
}
export function Section({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('rounded-xl border bg-card p-4 sm:p-5', className)} {...props} />
}
export function StatusBadge({ tone = 'neutral', children }: { tone?: 'neutral' | 'success' | 'warning' | 'error' | 'info'; children: ReactNode }) {
  const tones = { neutral: 'bg-muted text-muted-foreground', success: 'bg-success/10 text-success', warning: 'bg-warning/10 text-warning', error: 'bg-destructive/10 text-destructive', info: 'bg-info/10 text-info' }
  return <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium', tones[tone])}>{children}</span>
}
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="rounded-xl border border-dashed px-5 py-12 text-center"><Inbox className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
    <h2 className="mt-3 text-base font-semibold">{title}</h2>{description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}</div>
}
export function ErrorState({ title, detail, retry }: { title: string; detail?: string; retry: () => void }) {
  return <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
    <div className="flex gap-3"><AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden="true" /><div><h2 className="font-semibold">{title}</h2>{detail ? <p className="mt-1 text-sm">{detail}</p> : null}</div></div>
    <Button className="mt-4" variant="outline" onClick={retry}>Yeniden dene</Button></div>
}
export function FormField({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: string; error?: string; children: ReactNode }) {
  return <div className="space-y-2"><label htmlFor={htmlFor} className="block text-sm font-medium">{label}</label>{children}
    {hint ? <p id={htmlFor + '-hint'} className="text-xs text-muted-foreground">{hint}</p> : null}
    {error ? <p id={htmlFor + '-error'} role="alert" className="text-xs text-destructive">{error}</p> : null}</div>
}
