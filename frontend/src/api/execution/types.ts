import { z } from 'zod'

export const executionSessionSchema = z.object({
  id: z.string().uuid(), taskId: z.string().uuid(), taskTitle: z.string(), dailyPlanItemId: z.string().uuid().nullable(), startedAt: z.string(), endedAt: z.string().nullable(), version: z.number().int().nonnegative(), durationSeconds: z.number().int().nonnegative(),
})
export const executionStateSchema = z.object({ date: z.string(), timezone: z.string(), activeSession: executionSessionSchema.nullable(), sessions: z.array(executionSessionSchema) })
export type ExecutionState = z.infer<typeof executionStateSchema>
export type ExecutionSession = z.infer<typeof executionSessionSchema>
export class ExecutionClientError extends Error { constructor(message: string) { super(message); this.name = 'ExecutionClientError' } }
