import { z } from 'zod'

const itemSchema = z.object({
  id: z.string().uuid(), taskId: z.string().uuid(), taskTitle: z.string(), taskStageTitle: z.string().nullable(), taskType: z.enum(['WORK_ITEM', 'HABIT', 'OPPORTUNITY']), importance: z.number().int(), plannedStartMinute: z.number().int(), plannedEndMinute: z.number().int(), status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'SKIPPED']), version: z.number().int().nonnegative(),
})
const blockSchema = z.object({ id: z.string().uuid(), name: z.string(), startMinute: z.number().int(), endMinute: z.number().int(), items: z.array(itemSchema) })
const warningSchema = z.object({ taskId: z.string().uuid(), reasonCode: z.string(), unallocatedMinutes: z.number().int(), detail: z.string() })
export const dailyPlanSchema = z.object({ id: z.string().uuid(), date: z.string(), timezone: z.string(), sourceDayTypeId: z.string().uuid(), sourceDayTypeName: z.string(), status: z.enum(['ACTIVE', 'COMPLETED']), version: z.number().int(), generatedAt: z.string(), blocks: z.array(blockSchema), warnings: z.array(warningSchema) })
export type DailyPlan = z.infer<typeof dailyPlanSchema>
export type DailyPlanItem = DailyPlan['blocks'][number]['items'][number]

export class DailyPlanClientError extends Error { constructor(message: string) { super(message); this.name = 'DailyPlanClientError' } }
