import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { FocusPage } from './focus-page'

const { usePomodoro, useStart, useFinish, useUpdate, useTasks } = vi.hoisted(() => ({
  usePomodoro: vi.fn(), useStart: vi.fn(), useFinish: vi.fn(), useUpdate: vi.fn(), useTasks: vi.fn(),
}))
vi.mock('@/api/pomodoro/queries', () => ({ usePomodoro, useStartPomodoro: useStart, useFinishPomodoro: useFinish, useUpdatePomodoroSettings: useUpdate }))
vi.mock('@/api/tasks/queries', () => ({ useTasks }))

afterEach(cleanup)
it('shows the persisted active focus timer', () => {
  usePomodoro.mockReturnValue({ data: { settings: { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4, version: 0 }, activeSession: { id: '81000000-0000-0000-0000-000000000001', phase: 'FOCUS', status: 'ACTIVE', durationMinutes: 25, taskId: null, taskTitle: null, startedAt: new Date().toISOString(), plannedEndAt: new Date(Date.now() + 60_000).toISOString(), endedAt: null, version: 0 }, recentSessions: [], focusCyclesToday: 2 } })
  useStart.mockReturnValue({ mutate: vi.fn() }); useFinish.mockReturnValue({ mutate: vi.fn() }); useUpdate.mockReturnValue({ mutate: vi.fn(), isPending: false }); useTasks.mockReturnValue({ data: [] })
  render(<FocusPage />)
  expect(screen.getByRole('heading', { name: 'Odak sayacı' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Tamamla' })).toBeInTheDocument()
  expect(screen.getByText('2')).toBeInTheDocument()
  expect(screen.getByRole('timer')).toHaveTextContent('01:00')
})
