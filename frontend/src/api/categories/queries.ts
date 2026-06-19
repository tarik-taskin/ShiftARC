import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveCategory,
  createCategory,
  listCategories,
  restoreCategory,
  updateCategory,
} from './client'
import type {
  CategoryInput,
  CategoryUpdateInput,
  CategoryVersionInput,
} from './types'

export const categoryQueryKey = ['categories'] as const

export function useCategories(includeArchived: boolean, search: string) {
  return useQuery({
    queryKey: [...categoryQueryKey, { includeArchived, search }],
    queryFn: ({ signal }) => listCategories(includeArchived, search, signal),
  })
}

export function useCreateCategory() {
  return useCategoryMutation((input: CategoryInput) => createCategory(input))
}

export function useUpdateCategory() {
  return useCategoryMutation((input: CategoryUpdateInput) => updateCategory(input))
}

export function useArchiveCategory() {
  return useCategoryMutation((input: CategoryVersionInput) => archiveCategory(input))
}

export function useRestoreCategory() {
  return useCategoryMutation((input: CategoryVersionInput) => restoreCategory(input))
}

function useCategoryMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: categoryQueryKey }),
  })
}
