import { z } from 'zod'
export const calendarOverrideSchema = z.object({ date: z.string(), dayTypeId: z.string().uuid(), dayTypeName: z.string(), dayTypeColor: z.string(), version: z.number().int().nonnegative() })
export const calendarOverrideListSchema = z.array(calendarOverrideSchema)
export type CalendarOverride = z.infer<typeof calendarOverrideSchema>
