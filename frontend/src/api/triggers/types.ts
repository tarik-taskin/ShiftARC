import { z } from 'zod'

const categorySchema = z.object({ id: z.string().uuid(), name: z.string(), color: z.string() })
export const triggerSchema = z.object({
  id: z.string().uuid(), type: z.enum(['WORK_ITEM', 'HABIT']),
  scheduleType: z.enum(['INTERVAL', 'AFTER_CATEGORY']), title: z.string(),
  description: z.string().nullable(), importance: z.number().int(), durationMinutes: z.number().int(),
  intervalMinutes: z.number().int().nullable(), occurrenceTarget: z.number().int().nullable(),
  completedOccurrences: z.number().int(), nextDueAt: z.string().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']), categories: z.array(categorySchema),
  version: z.number().int().nonnegative(),
})
export const triggerListSchema = z.array(triggerSchema)
export type TriggerRule = z.infer<typeof triggerSchema>
export type TriggerInput = Pick<TriggerRule, 'type' | 'scheduleType' | 'title' | 'description' | 'importance' | 'durationMinutes' | 'intervalMinutes' | 'occurrenceTarget'> & { categoryIds: string[]; version?: number }
