import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TasksPage } from './tasks-page'

const mocks = vi.hoisted(() => ({ useTasks: vi.fn(), useSetTaskStatus: vi.fn(), useCreateTask: vi.fn(), useUpdateTask: vi.fn(), useCategories: vi.fn() }))
vi.mock('@/api/tasks/queries', () => ({ useTasks: mocks.useTasks, useSetTaskStatus: mocks.useSetTaskStatus, useCreateTask: mocks.useCreateTask, useUpdateTask: mocks.useUpdateTask }))
vi.mock('@/api/categories/queries', () => ({ useCategories: mocks.useCategories, useCreateCategory: vi.fn(() => mutation()), useUpdateCategory: vi.fn(() => mutation()) }))

describe('tasks page', () => {
  beforeEach(() => {
    mocks.useTasks.mockReturnValue({ data: [task()], isPending: false, isError: false, refetch: vi.fn() })
    mocks.useCategories.mockReturnValue({ data: [], isPending: false, isError: false })
    mocks.useSetTaskStatus.mockReturnValue(mutation())
    mocks.useCreateTask.mockReturnValue(mutation())
    mocks.useUpdateTask.mockReturnValue(mutation())
  })
  afterEach(() => cleanup())

  it('shows work item planning details', () => {
    render(<TasksPage />)
    expect(screen.getByRole('heading', { name: 'ML Dersi' })).toBeInTheDocument()
    expect(screen.getByText('300 dakika')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tamamla' })).toBeInTheDocument()
  })

  it('opens the reusable task dialog', async () => {
    const user = userEvent.setup()
    render(<TasksPage />)
    await user.click(screen.getByRole('button', { name: 'Yeni görev' }))
    expect(screen.getByRole('dialog', { name: 'Yeni görev' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Görev tipi' })).toBeInTheDocument()
  })
})

function mutation() { return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null } }
function task() { return { id: '61000000-0000-0000-0000-000000000001', type: 'WORK_ITEM' as const, title: 'ML Dersi', description: null, importance: 5, status: 'ACTIVE' as const, totalRequiredMinutes: 300, deadline: '2026-07-01', weeklyTargetMinutes: null, categories: [], version: 0, completedAt: null, createdAt: '2026-06-19T10:00:00Z', updatedAt: '2026-06-19T10:00:00Z' } }
