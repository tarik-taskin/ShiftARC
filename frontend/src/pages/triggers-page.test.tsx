import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { TriggersPage } from './triggers-page'

const hooks = vi.hoisted(() => ({ triggers: vi.fn(), create: vi.fn(), complete: vi.fn(), status: vi.fn(), categories: vi.fn() }))
vi.mock('@/api/triggers/queries', () => ({ useTriggers: hooks.triggers, useCreateTrigger: hooks.create, useCompleteTrigger: hooks.complete, useSetTriggerStatus: hooks.status }))
vi.mock('@/api/categories/queries', () => ({ useCategories: hooks.categories }))

afterEach(cleanup)
it('separates due triggers from regular tasks', () => {
  hooks.triggers.mockReturnValue({ data: [{ id: '91000000-0000-0000-0000-000000000001', type: 'HABIT', scheduleType: 'INTERVAL', title: 'Odayı havalandır', description: null, importance: 4, durationMinutes: 5, intervalMinutes: 120, occurrenceTarget: null, completedOccurrences: 0, nextDueAt: new Date(Date.now() - 1000).toISOString(), status: 'ACTIVE', categories: [], version: 0 }] })
  hooks.create.mockReturnValue({ mutateAsync: vi.fn(), isPending: false }); hooks.complete.mockReturnValue({ mutate: vi.fn() }); hooks.status.mockReturnValue({ mutate: vi.fn() }); hooks.categories.mockReturnValue({ data: [] })
  render(<TriggersPage />)
  expect(screen.getByText('Şimdi tetiklenenler')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Odayı havalandır' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Yaptım' })).toBeInTheDocument()
})
