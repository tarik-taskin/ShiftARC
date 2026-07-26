import { zodResolver } from '@hookform/resolvers/zod'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Clock3, Database, Sparkles } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { useCompleteOnboarding } from '@/api/workspace/queries'
import {
  backgroundModes,
  themeIds,
  type Workspace,
} from '@/api/workspace/types'
import { applyThemePreferences, themes } from '@/app/theme'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const onboardingSchema = z.object({
  timezone: z.string().min(1, 'Bir saat dilimi seçmelisin.'),
  themeId: z.enum(themeIds),
  backgroundMode: z.enum(backgroundModes),
  includeSampleData: z.boolean(),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

export function OnboardingPage({ workspace }: { workspace: Workspace }) {
  const reduceMotion = useReducedMotion()
  const onboarding = useCompleteOnboarding()
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      timezone: workspace.timezone,
      themeId: workspace.themeId,
      backgroundMode: workspace.backgroundMode,
      includeSampleData: true,
    },
  })
  const selectedTheme = useWatch({ control: form.control, name: 'themeId' })
  const selectedBackgroundMode = useWatch({
    control: form.control,
    name: 'backgroundMode',
  })
  const selectedTimezone = useWatch({ control: form.control, name: 'timezone' })
  const timezoneOptions = useMemo(
    () =>
      Array.from(
        new Set([
          workspace.timezone,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          'Europe/Istanbul',
          'UTC',
          'Europe/London',
          'America/New_York',
          'Asia/Tokyo',
        ]),
      ).filter(Boolean),
    [workspace.timezone],
  )

  useEffect(() => {
    applyThemePreferences(selectedTheme, selectedBackgroundMode)
  }, [selectedBackgroundMode, selectedTheme])

  const submit = form.handleSubmit(async (values) => {
    await onboarding.mutateAsync({ ...values, version: workspace.version })
  })

  return (
    <main className="app-canvas grid min-h-svh place-items-center overflow-hidden px-5 py-10 text-foreground sm:px-8">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.28 }}
        className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border/80 bg-card/78 shadow-2xl shadow-black/20 backdrop-blur-2xl"
        aria-labelledby="onboarding-title"
      >
        <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border-b border-border/70 bg-primary/[0.055] p-7 sm:p-10 lg:border-r lg:border-b-0">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="text-sm font-bold">ShiftARC</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  local workspace · 0.1.0
                </p>
              </div>
            </div>
            <p className="section-kicker mt-14">Başlangıç · 1/1</p>
            <h1
              id="onboarding-title"
              className="mt-4 text-4xl leading-[1] font-semibold tracking-[-0.05em] sm:text-5xl"
            >
              Çalışma alanını kendine uydur.
            </h1>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Saat dilimini ve görsel ritmini seç. Bu tercihler daha sonra
              görünüm ayarlarından değiştirilebilir.
            </p>
            <div className="mt-10 space-y-4">
              <OnboardingBenefit
                icon={Clock3}
                title="Doğru yerel zaman"
                detail="Planlar seçtiğin IANA saat dilimine göre hesaplanır."
              />
              <OnboardingBenefit
                icon={Database}
                title="Yalnız lokal veri"
                detail="Bu sürümde çalışma alanın bilgisayarındaki PostgreSQL'de kalır."
              />
              <OnboardingBenefit
                icon={Sparkles}
                title="İsteğe bağlı başlangıç"
                detail="Örnek gün tiplerini ekleyebilir veya tamamen boş başlayabilirsin."
              />
            </div>
          </div>

          <form className="space-y-8 p-7 sm:p-10" onSubmit={submit}>
            <fieldset>
              <legend className="text-sm font-semibold">Tema</legend>
              <p className="mt-1 text-xs text-muted-foreground">
                Renkler seçildiği anda önizlenir.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {themes.map((theme) => (
                  <label key={theme.id} className="cursor-pointer">
                    <input
                      type="radio"
                      value={theme.id}
                      className="peer sr-only"
                      {...form.register('themeId')}
                    />
                    <span className="block h-full rounded-2xl border border-border/80 bg-background/35 p-3 transition peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/20">
                      <span className="flex gap-1.5" aria-hidden="true">
                        {theme.colors.map((color) => (
                          <span
                            key={color}
                            className="size-6 rounded-full border border-white/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span className="mt-3 block text-sm font-semibold">
                        {theme.name}
                      </span>
                      <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">
                        {theme.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Saat dilimi
                <Select
                  value={selectedTimezone}
                  onValueChange={(value) => form.setValue('timezone', value, { shouldDirty: true, shouldValidate: true })}
                  options={timezoneOptions.map((timezone) => ({ value: timezone, label: timezone }))}
                  ariaLabel="Saat dilimi"
                />
              </label>

              <label className="block text-sm font-semibold">
                Arka plan davranışı
                <Select
                  value={selectedBackgroundMode}
                  onValueChange={(value) => form.setValue('backgroundMode', value as OnboardingFormValues['backgroundMode'], { shouldDirty: true, shouldValidate: true })}
                  options={[
                    { value: 'TIME_AWARE', label: 'Saate göre değişsin' },
                    { value: 'STATIC', label: 'Tema sabit kalsın' },
                  ]}
                  ariaLabel="Arka plan davranışı"
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/75 bg-background/35 p-4">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-input accent-[var(--primary)]"
                {...form.register('includeSampleData')}
              />
              <span>
                <span className="block text-sm font-semibold">
                  Başlangıç örneklerini ekle
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  İş Günü, Dinlenme Günü ve altı temel kategori oluşturulur.
                  Görev eklenmez.
                </span>
              </span>
            </label>

            {onboarding.error ? (
              <p className="rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive" role="alert">
                {onboarding.error.message}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              size="default"
              disabled={onboarding.isPending}
            >
              {onboarding.isPending ? 'Çalışma alanı hazırlanıyor…' : 'ShiftARC’ı hazırla'}
              {!onboarding.isPending ? <Check className="size-4" aria-hidden="true" /> : null}
            </Button>
          </form>
        </div>
      </motion.section>
    </main>
  )
}

function OnboardingBenefit({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Clock3
  title: string
  detail: string
}) {
  return (
    <div className="flex gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}
