import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { WeeklyPlanPage } from './weekly-plan-page'

const mocks = vi.hoisted(() => ({
  useWeeklyPlan: vi.fn(),
  useUpdateWeeklyPlan: vi.fn(),
  useDayTypes: vi.fn(),
  save: vi.fn(),
}))

vi.mock('@/api/weekly-plan/queries', () => ({
  useWeeklyPlan: mocks.useWeeklyPlan,
  useUpdateWeeklyPlan: mocks.useUpdateWeeklyPlan,
}))

vi.mock('@/api/day-types/queries', () => ({ useDayTypes: mocks.useDayTypes }))

describe('weekly plan page', () => {
  beforeEach(() => {
    mocks.save.mockReset()
    mocks.useWeeklyPlan.mockReturnValue({ data: plan(), isPending: false, isError: false, refetch: vi.fn() })
    mocks.useDayTypes.mockReturnValue({ data: [dayType()], isPending: false, isError: false, refetch: vi.fn() })
    mocks.useUpdateWeeklyPlan.mockReturnValue({ mutate: mocks.save, isPending: false, isSuccess: false, error: null })
  })

  afterEach(() => cleanup())

  it('renders all seven weekday selectors and missing-day status', () => {
    render(<WeeklyPlanPage />)

    expect(screen.getAllByRole('combobox')).toHaveLength(7)
    expect(screen.getByText('6 gün eksik')).toBeInTheDocument()
    expect(screen.getByLabelText('Pazartesi gün tipi')).toHaveValue(dayType().id)
  })

  it('saves the changed recurring assignment with the workspace version', async () => {
    const user = userEvent.setup()
    render(<WeeklyPlanPage />)

    await user.selectOptions(screen.getByLabelText('Salı gün tipi'), dayType().id)
    await user.click(screen.getByRole('button', { name: 'Haftayı kaydet' }))

    expect(mocks.save).toHaveBeenCalledWith({
      version: 4,
      assignments: [
        { dayOfWeek: 1, dayTypeId: dayType().id },
        { dayOfWeek: 2, dayTypeId: dayType().id },
      ],
    })
  })
})

function plan() {
  return {
    version: 4,
    complete: false,
    days: Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index + 1,
      dayType: index === 0 ? {
        id: dayType().id,
        name: dayType().name,
        color: dayType().color,
        archived: false,
        blockCount: 1,
      } : null,
    })),
  }
}

function dayType() {
  return {
    id: '51000000-0000-0000-0000-000000000001',
    name: 'İş Günü',
    color: '#8B7CFF',
    archived: false,
    version: 1,
    blocks: [{
      id: '52000000-0000-0000-0000-000000000001',
      name: 'Çalışma',
      startMinute: 0,
      endMinute: 1440,
      categoryIds: [],
    }],
  }
}
