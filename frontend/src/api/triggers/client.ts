import { triggerListSchema, triggerSchema, type TriggerInput, type TriggerRule } from './types'

const endpoint = '/api/v1/triggers'
export async function listTriggers(signal?: AbortSignal): Promise<TriggerRule[]> {
  return parse(await fetch(endpoint, { signal }), triggerListSchema)
}
export async function createTrigger(input: TriggerInput) {
  return parse(await fetch(endpoint, json('POST', input)), triggerSchema)
}
export async function completeTrigger(input: { id: string; version: number }) {
  return parse(await fetch(`${endpoint}/${input.id}/complete?version=${input.version}`, { method: 'POST' }), triggerSchema)
}
export async function setTriggerStatus(input: { id: string; version: number; status: 'ACTIVE' | 'ARCHIVED' }) {
  return parse(await fetch(`${endpoint}/${input.id}/status/${input.status}?version=${input.version}`, { method: 'POST' }), triggerSchema)
}
function json(method: string, body: unknown): RequestInit { return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }
async function parse<T>(response: Response, schema: { parse: (value: unknown) => T }): Promise<T> {
  if (!response.ok) { const body: unknown = await response.json().catch(() => null); throw new Error(typeof body === 'object' && body && 'detail' in body ? String(body.detail) : `HTTP ${response.status}`) }
  return schema.parse(await response.json())
}
