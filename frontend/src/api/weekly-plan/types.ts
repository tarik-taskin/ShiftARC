import { z } from 'zod'

const weeklyDayTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  archived: z.boolean(),
  blockCount: z.number().int().positive(),
})

const weeklyPlanDaySchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  dayType: weeklyDayTypeSchema.nullable(),
})

export const weeklyPlanSchema = z.object({
  version: z.number().int().nonnegative(),
  complete: z.boolean(),
  days: z.array(weeklyPlanDaySchema).length(7),
})

export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>

export interface WeeklyPlanUpdateInput {
  version: number
  assignments: Array<{ dayOfWeek: number; dayTypeId: string }>
}

export class WeeklyPlanClientError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'WeeklyPlanClientError'
    this.statusCode = statusCode
  }
}
