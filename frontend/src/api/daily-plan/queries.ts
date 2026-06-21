import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adjustTodayPlanItem, getTodayPlan, regenerateTodayPlan } from './client'
export const dailyPlanQueryKey = ['daily-plan', 'today'] as const
export function useTodayPlan() { return useQuery({ queryKey: dailyPlanQueryKey, queryFn: ({ signal }) => getTodayPlan(signal) }) }
export function useRegenerateTodayPlan() { const client = useQueryClient(); return useMutation({ mutationFn: regenerateTodayPlan, onSuccess: (plan) => client.setQueryData(dailyPlanQueryKey, plan) }) }
export function useAdjustTodayPlanItem() { const client = useQueryClient(); return useMutation({ mutationFn: adjustTodayPlanItem, onSuccess: (plan) => client.setQueryData(dailyPlanQueryKey, plan) }) }
