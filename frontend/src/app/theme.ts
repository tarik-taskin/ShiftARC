import type { BackgroundMode, ThemeId } from '@/api/workspace/types'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
  colors: [string, string, string]
}

export const themes: ThemeDefinition[] = [
  {
    id: 'arc-midnight',
    name: 'Arc Midnight',
    description: 'Derin yeşil, sakin ve yüksek odaklı.',
    colors: ['#07100e', '#65e6aa', '#16251f'],
  },
  {
    id: 'dawn',
    name: 'Dawn',
    description: 'Sıcak, aydınlık ve kâğıt hissinde.',
    colors: ['#fbf7ed', '#b45309', '#efe4cf'],
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Gece mavisi üzerinde canlı mor ve camgöbeği.',
    colors: ['#080b1d', '#a78bfa', '#14213d'],
  },
]

export function applyThemePreferences(
  themeId: ThemeId,
  backgroundMode: BackgroundMode,
) {
  const root = document.documentElement
  root.dataset.theme = themeId
  root.dataset.backgroundMode = backgroundMode
  root.dataset.dayPhase = getDayPhase(new Date().getHours())
}

export function refreshDayPhase() {
  document.documentElement.dataset.dayPhase = getDayPhase(new Date().getHours())
}

function getDayPhase(hour: number) {
  if (hour >= 5 && hour < 9) return 'morning'
  if (hour >= 9 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}
