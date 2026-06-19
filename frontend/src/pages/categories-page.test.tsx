import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CategoriesPage } from './categories-page'

const {
  mockUseCategories,
  mockUseCreateCategory,
  mockUseUpdateCategory,
  mockUseArchiveCategory,
  mockUseRestoreCategory,
  archive,
  restore,
} = vi.hoisted(() => ({
  mockUseCategories: vi.fn(),
  mockUseCreateCategory: vi.fn(),
  mockUseUpdateCategory: vi.fn(),
  mockUseArchiveCategory: vi.fn(),
  mockUseRestoreCategory: vi.fn(),
  archive: vi.fn(),
  restore: vi.fn(),
}))

vi.mock('@/api/categories/queries', () => ({
  useCategories: mockUseCategories,
  useCreateCategory: mockUseCreateCategory,
  useUpdateCategory: mockUseUpdateCategory,
  useArchiveCategory: mockUseArchiveCategory,
  useRestoreCategory: mockUseRestoreCategory,
}))

describe('categories page', () => {
  beforeEach(() => {
    archive.mockReset()
    restore.mockReset()
    mockUseCategories.mockReturnValue({
      data: [categoryFixture()],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    })
    mockUseCreateCategory.mockReturnValue(mutationFixture())
    mockUseUpdateCategory.mockReturnValue(mutationFixture())
    mockUseArchiveCategory.mockReturnValue(mutationFixture(archive))
    mockUseRestoreCategory.mockReturnValue(mutationFixture(restore))
  })

  afterEach(() => cleanup())

  it('lists categories and archives the selected category with its version', async () => {
    const user = userEvent.setup()
    render(<CategoriesPage />)

    expect(screen.getByRole('heading', { name: 'Ders' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Arşivle' }))

    expect(archive).toHaveBeenCalledWith({
      id: '41000000-0000-0000-0000-000000000001',
      version: 3,
    })
  })

  it('opens the reusable creation dialog from the page action', async () => {
    const user = userEvent.setup()
    render(<CategoriesPage />)

    await user.click(screen.getByRole('button', { name: 'Yeni kategori' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yeni kategori' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Kategori adı' })).toHaveFocus()
  })
})

function mutationFixture(mutate = vi.fn()) {
  return {
    mutate,
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  }
}

function categoryFixture() {
  return {
    id: '41000000-0000-0000-0000-000000000001',
    name: 'Ders',
    color: '#4F8CFF',
    icon: 'graduation-cap',
    archived: false,
    version: 3,
    createdAt: '2026-06-19T10:00:00Z',
    updatedAt: '2026-06-19T10:00:00Z',
  }
}
