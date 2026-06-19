import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { workspaceQueryKey } from '@/api/workspace/queries'

import { getWeeklyPlan, updateWeeklyPlan } from './client'

export const weeklyPlanQueryKey = ['weekly-plan'] as const

export function useWeeklyPlan() {
  return useQuery({
    queryKey: weeklyPlanQueryKey,
    queryFn: ({ signal }) => getWeeklyPlan(signal),
  })
}

export function useUpdateWeeklyPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateWeeklyPlan,
    onSuccess: (plan) => {
      queryClient.setQueryData(weeklyPlanQueryKey, plan)
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
    },
  })
}
