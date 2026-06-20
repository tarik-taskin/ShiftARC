import { z } from 'zod'
const session = z.object({ id: z.string().uuid(), phase: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK']), status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']), durationMinutes: z.number().int(), taskId: z.string().uuid().nullable(), taskTitle: z.string().nullable(), startedAt: z.string(), plannedEndAt: z.string(), endedAt: z.string().nullable(), version: z.number().int() })
export const pomodoroStateSchema = z.object({ settings: z.object({ focusMinutes: z.number().int(), shortBreakMinutes: z.number().int(), longBreakMinutes: z.number().int(), cyclesBeforeLongBreak: z.number().int(), version: z.number().int() }), activeSession: session.nullable(), recentSessions: z.array(session), focusCyclesToday: z.number().int() })
export type PomodoroState = z.infer<typeof pomodoroStateSchema>
export type PomodoroPhase = PomodoroState['recentSessions'][number]['phase']
