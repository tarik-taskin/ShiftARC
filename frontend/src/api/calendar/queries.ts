import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCalendarOverride, listCalendarOverrides, saveCalendarOverride } from './client'
export const calendarOverrideQueryKey = ['calendar-overrides'] as const
export function useCalendarOverrides(from: string, to: string) { return useQuery({ queryKey: [...calendarOverrideQueryKey, from, to], queryFn: ({ signal }) => listCalendarOverrides(from, to, signal) }) }
export function useSaveCalendarOverride() { return useCalendarMutation(saveCalendarOverride) }
export function useDeleteCalendarOverride() { return useCalendarMutation(deleteCalendarOverride) }
function useCalendarMutation<T>(mutationFn: (input: T) => Promise<unknown>) { const client = useQueryClient(); return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries({ queryKey: calendarOverrideQueryKey }) }) }
