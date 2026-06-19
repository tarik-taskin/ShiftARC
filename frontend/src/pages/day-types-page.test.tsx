import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DayTypesPage } from './day-types-page'

const mocks = vi.hoisted(() => ({
  useDayTypes: vi.fn(),
  useCategories: vi.fn(),
  useCreateDayType: vi.fn(),
  useUpdateDayType: vi.fn(),
  useReplaceDayTypeBlocks: vi.fn(),
  useArchiveDayType: vi.fn(),
  useRestoreDayType: vi.fn(),
}))

vi.mock('@/api/day-types/queries', () => ({
  useDayTypes: mocks.useDayTypes,
  useCreateDayType: mocks.useCreateDayType,
  useUpdateDayType: mocks.useUpdateDayType,
  useReplaceDayTypeBlocks: mocks.useReplaceDayTypeBlocks,
  useArchiveDayType: mocks.useArchiveDayType,
  useRestoreDayType: mocks.useRestoreDayType,
}))

vi.mock('@/api/categories/queries', () => ({ useCategories: mocks.useCategories }))

describe('day types page', () => {
  beforeEach(() => {
    mocks.useDayTypes.mockReturnValue({ data: [dayType()], isPending: false, isError: false, refetch: vi.fn() })
    mocks.useCategories.mockReturnValue({ data: [], isPending: false, isError: false })
    mocks.useCreateDayType.mockReturnValue(mutation())
    mocks.useUpdateDayType.mockReturnValue(mutation())
    mocks.useReplaceDayTypeBlocks.mockReturnValue(mutation())
    mocks.useArchiveDayType.mockReturnValue(mutation())
    mocks.useRestoreDayType.mockReturnValue(mutation())
  })

  afterEach(() => cleanup())

  it('renders the complete day timeline and block summary', () => {
    render(<DayTypesPage />)

    expect(screen.getByRole('heading', { name: 'İş Günü' })).toBeInTheDocument()
    expect(screen.getByLabelText('İş Günü zaman çizelgesi')).toBeInTheDocument()
    expect(screen.getAllByText('00:00–24:00').length).toBeGreaterThan(0)
  })

  it('opens the day type creation dialog', async () => {
    const user = userEvent.setup()
    render(<DayTypesPage />)

    await user.click(screen.getByRole('button', { name: 'Yeni gün tipi' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yeni gün tipi' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Gün tipi adı' })).toHaveFocus()
  })
})

function mutation() {
  return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null }
}

function dayType() {
  return {
    id: '51000000-0000-0000-0000-000000000001',
    name: 'İş Günü',
    color: '#8B7CFF',
    archived: false,
    version: 0,
    blocks: [{
      id: '52000000-0000-0000-0000-000000000001',
      name: 'Plansız',
      startMinute: 0,
      endMinute: 1440,
      categoryIds: [],
    }],
  }
}
