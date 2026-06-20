import { executionStateSchema, ExecutionClientError } from './types'
const endpoint = '/api/v1/execution'
export function getExecutionState(signal?: AbortSignal) { return request(`${endpoint}/today`, { signal }) }
export function startExecution(dailyPlanItemId: string) { return request(`${endpoint}/start`, json({ dailyPlanItemId })) }
export function finishExecution(input: { sessionId: string; version: number }) { return request(`${endpoint}/finish`, json(input)) }
export function transitionExecution(input: { sessionId: string; nextDailyPlanItemId: string; version: number }) { return request(`${endpoint}/transition`, json(input)) }
function json(body: unknown): RequestInit { return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }
async function request(url: string, init: RequestInit) { let response: Response; try { response = await fetch(url, init) } catch (error) { throw new ExecutionClientError(error instanceof Error ? error.message : 'Yürütme API erişilemiyor.') }; if (!response.ok) { let detail: string | undefined; try { const p: unknown = await response.json(); if (typeof p === 'object' && p && 'detail' in p && typeof p.detail === 'string') detail = p.detail } catch { detail = undefined }; throw new ExecutionClientError(detail ?? `Yürütme API HTTP ${response.status} yanıtı döndürdü.`) }; const parsed = executionStateSchema.safeParse(await response.json()); if (!parsed.success) throw new ExecutionClientError('Yürütme yanıtı sözleşmeyle eşleşmiyor.'); return parsed.data }
