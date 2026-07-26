import {
  Archive,
  ArchiveRestore,
  Armchair,
  Brain,
  BriefcaseBusiness,
  Dumbbell,
  GraduationCap,
  LoaderCircle,
  Moon,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tag,
  Tags,
  type LucideIcon,
} from 'lucide-react'
import { useDeferredValue, useState } from 'react'

import {
  useArchiveCategory,
  useCategories,
  useRestoreCategory,
} from '@/api/categories/queries'
import type { Category } from '@/api/categories/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CategoryDialog } from '@/features/categories/category-dialog'

const icons: Record<string, LucideIcon> = {
  tag: Tag,
  'briefcase-business': BriefcaseBusiness,
  'graduation-cap': GraduationCap,
  brain: Brain,
  dumbbell: Dumbbell,
  moon: Moon,
  sparkles: Sparkles,
  armchair: Armchair,
}

export function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const deferredSearch = useDeferredValue(search.trim())
  const categories = useCategories(includeArchived, deferredSearch)
  const archiveCategory = useArchiveCategory()
  const restoreCategory = useRestoreCategory()

  const openCreateDialog = () => {
    setEditingCategory(null)
    setDialogOpen(true)
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 pt-4 sm:pt-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="section-kicker">Planlama sözlüğü</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
            Kategoriler
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            Görevleri birden fazla bağlamda grupla; zaman bloklarının hangi işleri
            kabul edeceğini aynı kategorilerle belirle.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" aria-hidden="true" />
          Yeni kategori
        </Button>
      </section>

      <section className="rounded-3xl border border-border/75 bg-card/60 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Kategorilerde ara</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Kategori ara…"
              className="h-11 w-full rounded-xl border border-input bg-background/55 pr-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => setIncludeArchived(event.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Arşivlenenleri göster
          </label>
        </div>

        <CategoryListState
          categories={categories.data}
          isPending={categories.isPending}
          isError={categories.isError}
          onRetry={() => categories.refetch()}
          onEdit={openEditDialog}
          onArchive={setDeletingCategory}
          onRestore={(category) =>
            restoreCategory.mutate({ id: category.id, version: category.version })
          }
          onCreate={openCreateDialog}
        />
      </section>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
      />
      <Dialog open={Boolean(deletingCategory)} onOpenChange={(open) => { if (!open) setDeletingCategory(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyi sil?</DialogTitle>
            <DialogDescription>
              Bu kategori arşivlenecek ve bağlı görev, gün tipi bloğu ve trigger ilişkileri kaldırılacak. Geçmiş kayıtlar korunur.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>Vazgeç</Button>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={archiveCategory.isPending}
              onClick={() => {
                if (!deletingCategory) return
                archiveCategory.mutate(
                  { id: deletingCategory.id, version: deletingCategory.version },
                  { onSuccess: () => setDeletingCategory(null) },
                )
              }}
            >
              Evet, sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CategoryListState({
  categories,
  isPending,
  isError,
  onRetry,
  onEdit,
  onArchive,
  onRestore,
  onCreate,
}: {
  categories?: Category[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
  onEdit: (category: Category) => void
  onArchive: (category: Category) => void
  onRestore: (category: Category) => void
  onCreate: () => void
}) {
  if (isPending) {
    return (
      <div className="grid min-h-64 place-items-center" role="status">
        <LoaderCircle className="size-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Kategoriler yükleniyor</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="grid min-h-64 place-items-center text-center">
        <div>
          <p className="font-semibold">Kategoriler yüklenemedi</p>
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            Yeniden dene
          </Button>
        </div>
      </div>
    )
  }

  if (!categories?.length) {
    return (
      <div className="grid min-h-64 place-items-center text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Tags className="size-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Henüz kategori yok</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            İlk kategorini oluşturarak planlama sözlüğünü başlat.
          </p>
          <Button className="mt-5" variant="outline" onClick={onCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Kategori oluştur
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
        />
      ))}
    </div>
  )
}

function CategoryCard({
  category,
  onEdit,
  onArchive,
  onRestore,
}: {
  category: Category
  onEdit: (category: Category) => void
  onArchive: (category: Category) => void
  onRestore: (category: Category) => void
}) {
  const Icon = icons[category.icon ?? 'tag'] ?? Tag
  return (
    <article className="rounded-2xl border border-border/75 bg-background/35 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: category.color }}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-semibold">{category.name}</h2>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {category.color}
            </p>
          </div>
        </div>
        {category.archived ? (
          <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
            Arşivde
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-border/60 pt-3">
        {!category.archived ? (
          <>
            <Button size="sm" variant="ghost" onClick={() => onEdit(category)}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Düzenle
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onArchive(category)}>
              <Archive className="size-3.5" aria-hidden="true" />
              Arşivle
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onRestore(category)}>
            <ArchiveRestore className="size-3.5" aria-hidden="true" />
            Geri yükle
          </Button>
        )}
      </div>
    </article>
  )
}
