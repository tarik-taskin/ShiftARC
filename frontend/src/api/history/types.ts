import { z } from 'zod'
import { dailyPlanSchema } from '@/api/daily-plan/types'

export const historyDaySchema = z.object({ date: z.string(), planId: z.string().uuid(), dayTypeName: z.string(), status: z.enum(['ACTIVE', 'COMPLETED']), plannedMinutes: z.number().int(), executedMinutes: z.number().int(), completedItems: z.number().int(), totalItems: z.number().int(), sessionCount: z.number().int() })
export const historyDaysSchema = z.array(historyDaySchema)
const session = z.object({ id: z.string().uuid(), taskId: z.string().uuid(), taskTitle: z.string(), startedAt: z.string(), endedAt: z.string().nullable(), durationSeconds: z.number().int() })
const event = z.object({ id: z.string().uuid(), sessionId: z.string().uuid(), type: z.string(), occurredAt: z.string(), payload: z.string() })
export const historyDetailSchema = z.object({ summary: historyDaySchema, plan: dailyPlanSchema, sessions: z.array(session), events: z.array(event) })
export type HistoryDay = z.infer<typeof historyDaySchema>
export type HistoryDetail = z.infer<typeof historyDetailSchema>
