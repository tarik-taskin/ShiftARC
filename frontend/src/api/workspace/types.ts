import { z } from 'zod'

export const themeIds = ['amber', 'ion', 'grove'] as const
export const colorModes = ['LIGHT', 'DARK'] as const
export const clockStyles = ['DIGITAL', 'DIAL', 'SEGMENT'] as const
export type ColorMode = (typeof colorModes)[number]
export type ClockStyle = (typeof clockStyles)[number]

export const backgroundModes = ['TIME_AWARE', 'STATIC'] as const
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const workspaceSchema = z.object({
  id: z.string().regex(uuidPattern),
  name: z.string().min(1),
  timezone: z.string().min(1),
  weekStartsOn: z.number().int().min(1).max(7),
  themeId: z.enum(themeIds),
  colorMode: z.enum(colorModes),
  clockStyle: z.enum(clockStyles),
  backgroundMode: z.enum(backgroundModes),
  onboardingCompleted: z.boolean(),
  version: z.number().int().nonnegative(),
})

export type ThemeId = (typeof themeIds)[number]
export type BackgroundMode = (typeof backgroundModes)[number]
export type Workspace = z.infer<typeof workspaceSchema>

export interface WorkspacePreferencesInput {
  timezone: string
  themeId: ThemeId
  colorMode?: ColorMode
  clockStyle?: ClockStyle
  backgroundMode: BackgroundMode
  version: number
}

export interface OnboardingInput extends WorkspacePreferencesInput {
  includeSampleData: boolean
}

export class WorkspaceClientError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'WorkspaceClientError'
    this.statusCode = statusCode
  }
}
