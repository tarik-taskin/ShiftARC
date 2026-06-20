import { z } from 'zod'

export const taskTypeSchema = z.enum(['WORK_ITEM', 'HABIT'])
export const taskStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED'])

const taskCategorySchema = z.object({
  id: z.string().uuid(), name: z.string(), color: z.string(), icon: z.string().nullable(), archived: z.boolean(),
})

export const taskSchema = z.object({
  id: z.string().uuid(),
  type: taskTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  importance: z.number().int().min(1).max(5),
  status: taskStatusSchema,
  totalRequiredMinutes: z.number().int().nullable(),
  deadline: z.string().nullable(),
  weeklyTargetMinutes: z.number().int().nullable(),
  executedMinutes: z.number().int().nonnegative(),
  remainingMinutes: z.number().int().nonnegative(),
  categories: z.array(taskCategorySchema),
  version: z.number().int().nonnegative(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const taskListSchema = z.array(taskSchema)
export type Task = z.infer<typeof taskSchema>
export type TaskType = z.infer<typeof taskTypeSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>

export interface TaskInput {
  type: TaskType
  title: string
  description: string | null
  importance: number
  totalRequiredMinutes: number | null
  deadline: string | null
  weeklyTargetMinutes: number | null
  categoryIds: string[]
  version?: number | null
}

export interface TaskFilters {
  type?: TaskType | ''
  status?: TaskStatus | ''
  categoryId?: string
  search?: string
  sort?: 'PRIORITY' | 'DEADLINE' | 'CREATED'
}

export class TaskClientError extends Error {
  constructor(message: string) { super(message); this.name = 'TaskClientError' }
}
