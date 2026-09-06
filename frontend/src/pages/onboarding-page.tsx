import { zodResolver } from '@hookform/resolvers/zod'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Clock3, Database, Sparkles } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { useCompleteOnboarding } from '@/api/workspace/queries'
import {
  backgroundModes, colorModes, clockStyles,
  themeIds,
  type Workspace,
} from '@/api/workspace/types'
import { applyThemePreferences } from '@/app/theme'
import { AppearanceOptions } from '@/components/appearance-options'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const onboardingSchema = z.object({
  timezone: z.string().min(1, 'Bir saat dilimi seçmelisin.'),
  themeId: z.enum(themeIds),
  colorMode: z.enum(colorModes),
  clockStyle: z.enum(clockStyles),
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
      colorMode: workspace.colorMode,
      clockStyle: workspace.clockStyle,
      backgroundMode: workspace.backgroundMode,
      includeSampleData: true,
    },
  })
  const selectedColorMode = useWatch({ control: form.control, name: 'colorMode' })
  const selectedClockStyle = useWatch({ control: form.control, name: 'clockStyle' })
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
    applyThemePreferences(selectedTheme, selectedBackgroundMode, selectedColorMode, selectedTimezone)
  }, [selectedBackgroundMode, selectedTheme, selectedColorMode, selectedTimezone])

  const submit = form.handleSubmit(async (values) => {
    try { await onboarding.mutateAsync({ ...values, version: workspace.version }) } catch { /* Display the mutation error in the form. */ }
  })

  return (
    <main className="app-canvas grid min-h-svh place-items-center overflow-hidden px-5 py-10 text-foreground sm:px-8">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.28 }}
        className="w-full max-w-6xl overflow-hidden rounded-xl border border-border/80 bg-card  "
        aria-labelledby="onboarding-title"
      >
        <div className="grid lg:grid-cols-[0.65fr_1.35fr]">
          <div className="border-b border-border/70 bg-primary/[0.055] p-5 sm:p-7 lg:border-r lg:border-b-0">
            <div className="flex items-center gap-3">
              <BrandMark />
              <div>
                <p className="text-sm font-bold">ShiftARC</p>
                <p className="font-mono text-xs text-muted-foreground">
                  local workspace · 0.1.0
                </p>
              </div>
            </div>
            <p className="section-kicker mt-8">Başlangıç · 1/1</p>
            <h1
              id="onboarding-title"
              className="mt-4 text-[28px] leading-tight font-semibold tracking-[-0.05em] sm:text-[32px]"
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

          <form className="space-y-6 p-5 sm:p-7" onSubmit={submit}>
            <AppearanceOptions value={{ themeId: selectedTheme, colorMode: selectedColorMode, clockStyle: selectedClockStyle }} onChange={(value) => { form.setValue('themeId', value.themeId); form.setValue('colorMode', value.colorMode); form.setValue('clockStyle', value.clockStyle) }} />

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

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/75 bg-background/35 p-4">
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
