import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completeTrigger, createTrigger, listTriggers, setTriggerStatus } from './client'
export const triggerQueryKey = ['triggers'] as const
export function useTriggers() { return useQuery({ queryKey: triggerQueryKey, queryFn: ({ signal }) => listTriggers(signal), refetchInterval: 60_000 }) }
export function useCreateTrigger() { return useTriggerMutation(createTrigger) }
export function useCompleteTrigger() { return useTriggerMutation(completeTrigger) }
export function useSetTriggerStatus() { return useTriggerMutation(setTriggerStatus) }
function useTriggerMutation<T>(mutationFn: (input: T) => Promise<unknown>) { const client = useQueryClient(); return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries({ queryKey: triggerQueryKey }) }) }
