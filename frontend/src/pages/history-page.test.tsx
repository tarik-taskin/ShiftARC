import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { HistoryPage } from './history-page'

const hooks = vi.hoisted(() => ({ days: vi.fn(), detail: vi.fn() }))
vi.mock('@/api/history/queries', () => ({ useHistoryDays: hooks.days, useHistoryDetail: hooks.detail }))
afterEach(cleanup)

it('opens a daily snapshot from the calendar', async () => {
  const now = new Date(); const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-20`
  const summary = { date, planId: '71000000-0000-0000-0000-000000000001', dayTypeName: 'İş Günü', status: 'ACTIVE', plannedMinutes: 120, executedMinutes: 60, completedItems: 1, totalItems: 2, sessionCount: 1 }
  hooks.days.mockReturnValue({ data: [summary], isPending: false })
  hooks.detail.mockImplementation((selected: string | null) => ({ data: selected ? { summary, plan: { id: summary.planId, date, timezone: 'Europe/Istanbul', sourceDayTypeId: '51000000-0000-0000-0000-000000000001', sourceDayTypeName: 'İş Günü', status: 'ACTIVE', version: 0, generatedAt: new Date().toISOString(), blocks: [], warnings: [] }, sessions: [], events: [] } : undefined }))
  const user = userEvent.setup(); render(<HistoryPage />)
  await user.click(screen.getByRole('button', { name: `${date} snapshot'ını aç` }))
  expect(screen.getByRole('heading', { name: 'İş Günü' })).toBeInTheDocument()
  expect(screen.getByText('60 dk')).toBeInTheDocument()
})
