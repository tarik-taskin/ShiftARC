import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  completeOnboarding,
  getWorkspace,
  updateWorkspaceSettings,
} from './client'
import type { OnboardingInput, Workspace, WorkspacePreferencesInput } from './types'

export const workspaceQueryKey = ['workspace', 'local'] as const

export function useWorkspace() {
  return useQuery({
    queryKey: workspaceQueryKey,
    queryFn: ({ signal }) => getWorkspace(signal),
  })
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OnboardingInput) => completeOnboarding(input),
    onSuccess: (workspace: Workspace) => {
      queryClient.setQueryData(workspaceQueryKey, workspace)
    },
  })
}

export function useUpdateWorkspaceSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: WorkspacePreferencesInput) => updateWorkspaceSettings(input),
    onSuccess: (workspace: Workspace) => {
      queryClient.setQueryData(workspaceQueryKey, workspace)
    },
  })
}
