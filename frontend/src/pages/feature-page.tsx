import { ArrowRight, Sparkles } from 'lucide-react'

import { productMilestones } from '@/app/navigation'

interface FeaturePageProps {
  eyebrow: string
  title: string
  description: string
  nextStep: string
}

export function TodayPage() {
  return (
    <div className="space-y-8">
      <section className="max-w-4xl pt-4 sm:pt-8">
        <p className="section-kicker">İlk kullanılabilir sürüm</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[0.98] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
          Bugünün ritmini kur.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          ShiftARC artık ürün modüllerini taşıyacak gerçek bir çalışma alanına
          sahip. Gün tipleri, görevler ve canlı akış bu iskelet üzerinde
          birleşecek.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Gün özeti">
        {productMilestones.map(({ icon: Icon, title, value, detail }) => (
          <article
            key={title}
            className="group min-h-56 rounded-3xl border border-border/75 bg-card/65 p-5 shadow-sm backdrop-blur-xl transition-colors hover:border-primary/25"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                0.1.0
              </span>
            </div>
            <p className="mt-8 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              {title}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
              {value}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {detail}
            </p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-primary/15 bg-primary/[0.06] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            Sıradaki yapı taşı
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Workspace, onboarding ve tema tercihleri bağlandığında bu ekran
            kişisel günlük akışa dönüşecek.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          Faz 2 ile devam
          <ArrowRight className="size-4 text-primary" aria-hidden="true" />
        </span>
      </section>
    </div>
  )
}

export function FeaturePage({
  eyebrow,
  title,
  description,
  nextStep,
}: FeaturePageProps) {
  return (
    <section className="grid min-h-[calc(100svh-10rem)] place-items-center py-10">
      <div className="w-full max-w-4xl rounded-[2rem] border border-border/75 bg-card/60 p-7 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-12">
        <p className="section-kicker">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-border/70 bg-background/45 p-4">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <p className="text-sm leading-6 text-muted-foreground">{nextStep}</p>
        </div>
      </div>
    </section>
  )
}
