import { dailyPlanSchema, DailyPlanClientError } from './types'
const endpoint = '/api/v1/daily-plan/today'
export async function getTodayPlan(signal?: AbortSignal) { return request(endpoint, { signal }) }
export async function regenerateTodayPlan(version: number) { return request(`${endpoint}/regenerate?version=${version}`, { method: 'POST' }) }
async function request(url: string, init: RequestInit) {
  let response: Response
  try { response = await fetch(url, init) } catch (error) { throw new DailyPlanClientError(error instanceof Error ? error.message : 'Günlük plan API erişilemiyor.') }
  if (!response.ok) { let detail: string | undefined; try { const problem: unknown = await response.json(); if (typeof problem === 'object' && problem && 'detail' in problem && typeof problem.detail === 'string') detail = problem.detail } catch { detail = undefined }; throw new DailyPlanClientError(detail ?? `Günlük plan API HTTP ${response.status} yanıtı döndürdü.`) }
  const parsed = dailyPlanSchema.safeParse(await response.json()); if (!parsed.success) throw new DailyPlanClientError('Günlük plan yanıtı sözleşmeyle eşleşmiyor.'); return parsed.data
}
