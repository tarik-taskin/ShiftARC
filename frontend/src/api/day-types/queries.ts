import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveDayType,
  createDayType,
  listDayTypes,
  replaceDayTypeBlocks,
  restoreDayType,
  updateDayType,
} from './client'

export const dayTypeQueryKey = ['day-types'] as const

export function useDayTypes(includeArchived: boolean) {
  return useQuery({
    queryKey: [...dayTypeQueryKey, { includeArchived }],
    queryFn: ({ signal }) => listDayTypes(includeArchived, signal),
  })
}

export function useCreateDayType() {
  return useDayTypeMutation(createDayType)
}

export function useUpdateDayType() {
  return useDayTypeMutation(updateDayType)
}

export function useReplaceDayTypeBlocks() {
  return useDayTypeMutation(replaceDayTypeBlocks)
}

export function useArchiveDayType() {
  return useDayTypeMutation(archiveDayType)
}

export function useRestoreDayType() {
  return useDayTypeMutation(restoreDayType)
}

function useDayTypeMutation<T>(mutationFn: (input: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dayTypeQueryKey }),
  })
}
