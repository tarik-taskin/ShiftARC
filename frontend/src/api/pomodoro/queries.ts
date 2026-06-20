import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finishPomodoro, getPomodoro, startPomodoro, updatePomodoroSettings } from './client'
export const pomodoroQueryKey = ['pomodoro'] as const
export function usePomodoro() { return useQuery({ queryKey: pomodoroQueryKey, queryFn: ({ signal }) => getPomodoro(signal), refetchInterval: 30_000 }) }
export function useStartPomodoro() { return usePomodoroMutation(startPomodoro) }
export function useFinishPomodoro() { return usePomodoroMutation(finishPomodoro) }
export function useUpdatePomodoroSettings() { return usePomodoroMutation(updatePomodoroSettings) }
function usePomodoroMutation<T>(mutationFn: (input: T) => Promise<unknown>) { const client = useQueryClient(); return useMutation({ mutationFn, onSuccess: (state) => client.setQueryData(pomodoroQueryKey, state) }) }
