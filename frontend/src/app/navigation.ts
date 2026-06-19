import {
  CalendarDays,
  CalendarRange,
  History,
  LayoutDashboard,
  ListTodo,
  Palette,
  Settings2,
  Shapes,
  Tags,
  type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
  label: string
  shortLabel?: string
  path: string
  icon: LucideIcon
  description: string
}

export const primaryNavigation: NavigationItem[] = [
  {
    label: 'Bugün',
    path: '/',
    icon: LayoutDashboard,
    description: 'Günün akışı ve mevcut görev',
  },
  {
    label: 'Haftalık plan',
    shortLabel: 'Hafta',
    path: '/week',
    icon: CalendarRange,
    description: 'Tekrarlayan gün tipi düzeni',
  },
  {
    label: 'Gün tipleri',
    shortLabel: 'Günler',
    path: '/day-types',
    icon: Shapes,
    description: 'Zaman blokları ve kategoriler',
  },
  {
    label: 'Görevler',
    path: '/tasks',
    icon: ListTodo,
    description: 'İş parçacıkları ve alışkanlıklar',
  },
  {
    label: 'Kategoriler',
    shortLabel: 'Kategori',
    path: '/categories',
    icon: Tags,
    description: 'Görev ve zaman bloğu bağlamları',
  },
  {
    label: 'Geçmiş',
    path: '/history',
    icon: History,
    description: 'Tamamlanan günlerin kayıtları',
  },
]

export const utilityNavigation: NavigationItem[] = [
  {
    label: 'Görünüm',
    path: '/settings/preferences',
    icon: Palette,
    description: 'Tema ve arka plan tercihleri',
  },
  {
    label: 'Sistem durumu',
    shortLabel: 'Sistem',
    path: '/settings/system',
    icon: Settings2,
    description: 'Lokal servis bağlantıları',
  },
]

export const allNavigation = [...primaryNavigation, ...utilityNavigation]

export const productMilestones = [
  {
    icon: CalendarDays,
    title: 'Gün tipi',
    value: 'Henüz seçilmedi',
    detail: 'Haftalık şablon tamamlandığında burada görünecek.',
  },
  {
    icon: Shapes,
    title: 'Plan durumu',
    value: 'Kurulum bekleniyor',
    detail: 'Zaman blokları ve kategoriler sonraki adımlarda bağlanacak.',
  },
  {
    icon: ListTodo,
    title: 'Sıradaki görev',
    value: 'Planlanmadı',
    detail: 'Planlama motoru uygun görevi bu alana yerleştirecek.',
  },
]
