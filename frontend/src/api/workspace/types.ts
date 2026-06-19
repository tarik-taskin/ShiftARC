import { z } from 'zod'

export const themeIds = ['arc-midnight', 'dawn', 'aurora'] as const
export const backgroundModes = ['TIME_AWARE', 'STATIC'] as const
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const workspaceSchema = z.object({
  id: z.string().regex(uuidPattern),
  name: z.string().min(1),
  timezone: z.string().min(1),
  weekStartsOn: z.number().int().min(1).max(7),
  themeId: z.enum(themeIds),
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
