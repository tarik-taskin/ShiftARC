import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  useCreateCategory,
  useUpdateCategory,
} from '@/api/categories/queries'
import type { Category } from '@/api/categories/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Kategori adı zorunludur.')
    .max(80, 'Kategori adı en fazla 80 karakter olabilir.'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir renk seçmelisin.'),
  icon: z.string(),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

const categoryIconOptions = [
  { value: 'tag', label: 'Etiket' },
  { value: 'briefcase-business', label: 'İş' },
  { value: 'graduation-cap', label: 'Eğitim' },
  { value: 'brain', label: 'Zihin' },
  { value: 'dumbbell', label: 'Spor' },
  { value: 'moon', label: 'Uyku' },
  { value: 'sparkles', label: 'Kişisel bakım' },
  { value: 'armchair', label: 'Dinlenme' },
] as const

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: CategoryDialogProps) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const activeMutation = category ? updateCategory : createCategory
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: formValues(category),
  })

  useEffect(() => {
    if (open) form.reset(formValues(category))
  }, [category, form, open])

  const submit = form.handleSubmit(async (values) => {
    const input = {
      name: values.name,
      color: values.color.toUpperCase(),
      icon: values.icon || null,
    }
    if (category) {
      await updateCategory.mutateAsync({
        ...input,
        id: category.id,
        version: category.version,
      })
    } else {
      await createCategory.mutateAsync(input)
    }
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Kategoriyi düzenle' : 'Yeni kategori'}</DialogTitle>
          <DialogDescription>
            Görevlerin ve zaman bloklarının ortak dilini isim, renk ve ikonla tanımla.
          </DialogDescription>
        </DialogHeader>

        <form id="category-form" className="mt-6 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-semibold">
            Kategori adı
            <input
              autoFocus
              className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Örn. Yapay Zeka"
              {...form.register('name')}
            />
            {form.formState.errors.name ? (
              <span className="mt-1.5 block text-xs text-destructive" role="alert">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          <div className="grid gap-5 sm:grid-cols-[112px_1fr]">
            <label className="block text-sm font-semibold">
              Renk
              <input
                type="color"
                className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-input bg-background p-1"
                {...form.register('color')}
              />
            </label>
            <label className="block text-sm font-semibold">
              İkon
              <select
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background/60 px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                {...form.register('icon')}
              >
                {categoryIconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeMutation.error ? (
            <p className="rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive" role="alert">
              {activeMutation.error.message}
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button type="submit" form="category-form" disabled={activeMutation.isPending}>
            {activeMutation.isPending
              ? 'Kaydediliyor…'
              : category
                ? 'Değişiklikleri kaydet'
                : 'Kategori oluştur'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formValues(category?: Category | null): CategoryFormValues {
  return {
    name: category?.name ?? '',
    color: category?.color ?? '#65E6AA',
    icon: category?.icon ?? 'tag',
  }
}
