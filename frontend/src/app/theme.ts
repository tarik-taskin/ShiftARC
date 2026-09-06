import type { BackgroundMode, ColorMode, ThemeId } from '@/api/workspace/types'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  description: string
  colors: [string, string, string, string, string]
}
export const themes: ThemeDefinition[] = [
  { id: 'amber', name: 'Kehribar', description: 'Krem, mürdüm ve sıcak altın.', colors: ['#E3170A', '#A9E5BB', '#FCF6B1', '#F7B32B', '#2D1E2F'] },
  { id: 'ion', name: 'İyon', description: 'Berrak mavi, mor ve arduvaz.', colors: ['#091BE3', '#CEE6AA', '#B1CFFC', '#722AF7', '#1D272E'] },
  { id: 'grove', name: 'Koruluk', description: 'Zeytin yeşili, sarı ve mürekkep.', colors: ['#28502E', '#47682C', '#CF1259', '#E3D26F', '#0D0C1D'] },
]

export function applyThemePreferences(themeId: ThemeId, backgroundMode: BackgroundMode, colorMode: ColorMode = 'LIGHT', timezone = 'Europe/Istanbul') {
  const root = document.documentElement
  root.dataset.theme = themeId
  root.dataset.backgroundMode = backgroundMode
  root.dataset.colorMode = colorMode
  refreshDayPhase(timezone)
}

export function refreshDayPhase(timezone = 'Europe/Istanbul') {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' }).format(new Date()))
  document.documentElement.dataset.dayPhase = hour < 5 || hour >= 21 ? 'night' : hour < 9 ? 'morning' : hour < 17 ? 'day' : 'evening'
}
