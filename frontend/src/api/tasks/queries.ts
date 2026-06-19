import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTask, listTasks, setTaskStatus, updateTask } from './client'
import type { TaskFilters } from './types'

export const taskQueryKey = ['tasks'] as const
export function useTasks(filters: TaskFilters) { return useQuery({ queryKey: [...taskQueryKey, filters], queryFn: ({ signal }) => listTasks(filters, signal) }) }
export function useCreateTask() { return useTaskMutation(createTask) }
export function useUpdateTask() { return useTaskMutation(updateTask) }
export function useSetTaskStatus() { return useTaskMutation(setTaskStatus) }
function useTaskMutation<T>(mutationFn: (input: T) => Promise<unknown>) { const client = useQueryClient(); return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries({ queryKey: taskQueryKey }) }) }
