import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { CalendarPage } from './calendar-page'

const hooks = vi.hoisted(() => ({ overrides: vi.fn(), save: vi.fn(), remove: vi.fn(), dayTypes: vi.fn() }))
vi.mock('@/api/calendar/queries', () => ({ useCalendarOverrides: hooks.overrides, useSaveCalendarOverride: hooks.save, useDeleteCalendarOverride: hooks.remove }))
vi.mock('@/api/day-types/queries', () => ({ useDayTypes: hooks.dayTypes }))
afterEach(cleanup)

it('edits a date-specific day type', async () => {
  const now = new Date(); const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  hooks.overrides.mockReturnValue({ data: [{ date, dayTypeId: '51000000-0000-0000-0000-000000000001', dayTypeName: 'Tatil', dayTypeColor: '#22C55E', version: 0 }] })
  hooks.dayTypes.mockReturnValue({ data: [{ id: '51000000-0000-0000-0000-000000000001', name: 'Tatil' }] })
  hooks.save.mockReturnValue({ mutate: vi.fn(), isPending: false, error: null }); hooks.remove.mockReturnValue({ mutate: vi.fn(), error: null })
  const user = userEvent.setup(); render(<CalendarPage />)
  await user.click(screen.getByRole('button', { name: `${date} gününü düzenle` }))
  expect(screen.getByRole('heading', { name: 'Gün tipi istisnası' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Tatil' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Şablona dön' })).toBeInTheDocument()
})
