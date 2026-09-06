interface FeaturePageProps {
  eyebrow: string
  title: string
  description: string
  nextStep: string
}

export function FeaturePage({
  eyebrow,
  title,
  description,
  nextStep,
}: FeaturePageProps) {
  return (
    <section className="grid min-h-[calc(100svh-10rem)] place-items-center py-10">
      <div className="w-full max-w-4xl rounded-xl border border-border/75 bg-card p-7 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-12">
        <p className="section-kicker">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.05em] text-balance sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          {description}
        </p>
        <div className="mt-10 flex items-start gap-3 rounded-lg border border-border/70 bg-background/45 p-4">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          <p className="text-sm leading-6 text-muted-foreground">{nextStep}</p>
        </div>
      </div>
    </section>
  )
}
