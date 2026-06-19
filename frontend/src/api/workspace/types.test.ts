import { describe, expect, it } from 'vitest'

import { workspaceSchema } from './types'

describe('workspace contract', () => {
  it('accepts the stable local workspace identifier', () => {
    const workspace = workspaceSchema.parse({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Lokal Çalışma Alanı',
      timezone: 'Europe/Istanbul',
      weekStartsOn: 1,
      themeId: 'arc-midnight',
      backgroundMode: 'TIME_AWARE',
      onboardingCompleted: false,
      version: 0,
    })

    expect(workspace.id).toBe('00000000-0000-0000-0000-000000000001')
  })
})
