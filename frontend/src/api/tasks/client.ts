import { taskListSchema, taskSchema, TaskClientError, type TaskFilters, type TaskInput, type TaskStatus } from './types'

const endpoint = '/api/v1/tasks'

export async function listTasks(filters: TaskFilters, signal?: AbortSignal) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, String(value)) })
  return parse(await safeFetch(`${endpoint}?${params}`, { signal }), taskListSchema)
}

export async function createTask(input: TaskInput) {
  return parse(await safeFetch(endpoint, json('POST', input)), taskSchema)
}

export async function updateTask(input: TaskInput & { id: string }) {
  const { id, ...body } = input
  return parse(await safeFetch(`${endpoint}/${id}`, json('PUT', body)), taskSchema)
}

export async function setTaskStatus(input: { id: string; status: TaskStatus; version: number }) {
  return parse(await safeFetch(`${endpoint}/${input.id}/status/${input.status}?version=${input.version}`, { method: 'POST' }), taskSchema)
}

function json(method: string, body: unknown): RequestInit { return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } }

async function parse<T>(response: Response, schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }) {
  const parsed = schema.safeParse(await response.json())
  if (!parsed.success) throw new TaskClientError('Görev API yanıtı beklenen sözleşmeyle eşleşmiyor.')
  return parsed.data
}

async function safeFetch(url: string, init: RequestInit) {
  let response: Response
  try { response = await fetch(url, init) } catch (error) { throw new TaskClientError(error instanceof Error ? error.message : 'Görev API erişilemiyor.') }
  if (!response.ok) {
    let detail: string | undefined
    try { const problem: unknown = await response.json(); if (typeof problem === 'object' && problem && 'detail' in problem && typeof problem.detail === 'string') detail = problem.detail } catch { detail = undefined }
    throw new TaskClientError(detail ?? `Görev API HTTP ${response.status} yanıtı döndürdü.`)
  }
  return response
}
