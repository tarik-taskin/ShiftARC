import { pomodoroStateSchema, type PomodoroPhase } from './types'
const endpoint = '/api/v1/pomodoro'
export const getPomodoro = (signal?: AbortSignal) => request(endpoint, { signal })
export const startPomodoro = (input: { phase: PomodoroPhase; taskId: string | null }) => request(`${endpoint}/start`, json('POST', input))
export const finishPomodoro = (input: { sessionId: string; version: number; cancelled?: boolean }) => request(`${endpoint}/${input.cancelled ? 'cancel' : 'complete'}`, json('POST', { sessionId: input.sessionId, version: input.version }))
export const updatePomodoroSettings = (input: { focusMinutes: number; shortBreakMinutes: number; longBreakMinutes: number; cyclesBeforeLongBreak: number; version: number }) => request(`${endpoint}/settings`, json('PUT', input))
function json(method: string, body: unknown): RequestInit { return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }
async function request(url: string, init: RequestInit) { const response = await fetch(url, init); if (!response.ok) throw new Error(`Pomodoro API HTTP ${response.status}`); return pomodoroStateSchema.parse(await response.json()) }
