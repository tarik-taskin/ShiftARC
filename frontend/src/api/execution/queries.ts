import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dailyPlanQueryKey } from '@/api/daily-plan/queries'
import { correctExecutionTimes, finishExecution, getExecutionState, startExecution, transitionExecution } from './client'
export const executionQueryKey = ['execution', 'today'] as const
export function useExecutionState() { return useQuery({ queryKey: executionQueryKey, queryFn: ({ signal }) => getExecutionState(signal) }) }
export function useStartExecution() { return useExecutionMutation(startExecution) }
export function useFinishExecution() { return useExecutionMutation(finishExecution) }
export function useTransitionExecution() { return useExecutionMutation(transitionExecution) }
export function useCorrectExecutionTimes() { return useExecutionMutation(correctExecutionTimes) }
function useExecutionMutation<T>(mutationFn: (input: T) => Promise<unknown>) { const client = useQueryClient(); return useMutation({ mutationFn, onSuccess: (state) => { client.setQueryData(executionQueryKey, state); client.invalidateQueries({ queryKey: dailyPlanQueryKey }) } }) }
