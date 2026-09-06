import { describe, expect, it } from 'vitest'

import { workspaceSchema } from './types'

describe('workspace contract', () => {
  it('rejects missing appearance fields and unsupported themes', () => {
    const input = { id: '00000000-0000-0000-0000-000000000001', name: 'Test',
      timezone: 'Europe/Istanbul', weekStartsOn: 1, themeId: 'amber',
      backgroundMode: 'STATIC', onboardingCompleted: true, version: 1 }
    expect(workspaceSchema.safeParse(input).success).toBe(false)
    expect(workspaceSchema.safeParse({ ...input, colorMode: 'LIGHT', clockStyle: 'DIGITAL' }).success).toBe(true)
    expect(workspaceSchema.safeParse({ ...input, colorMode: 'LIGHT', clockStyle: 'INVALID' }).success).toBe(false)
  })

  it('accepts the stable local workspace identifier', () => {
    const workspace = workspaceSchema.parse({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Lokal Ã‡alÄ±ÅŸma AlanÄ±',
      timezone: 'Europe/Istanbul',
      weekStartsOn: 1,
      colorMode: 'LIGHT' as const,
    clockStyle: 'DIGITAL' as const,
    themeId: 'amber',
      backgroundMode: 'TIME_AWARE',
      onboardingCompleted: false,
      version: 0,
    })

    expect(workspace.id).toBe('00000000-0000-0000-0000-000000000001')
  })
})
