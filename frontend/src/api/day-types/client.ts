import {
  dayTypeListSchema,
  dayTypeSchema,
  DayTypeClientError,
  type DayTypeBlocksInput,
  type DayTypeInput,
  type DayTypeUpdateInput,
  type DayTypeVersionInput,
} from './types'

const endpoint = '/api/v1/day-types'

export async function listDayTypes(includeArchived: boolean, signal?: AbortSignal) {
  return parse(
    await safeFetch(`${endpoint}?includeArchived=${includeArchived}`, { signal }),
    dayTypeListSchema,
  )
}

export async function createDayType(input: DayTypeInput) {
  return parse(await safeFetch(endpoint, json('POST', input)), dayTypeSchema)
}

export async function updateDayType(input: DayTypeUpdateInput) {
  const { id, ...body } = input
  return parse(await safeFetch(`${endpoint}/${id}`, json('PUT', body)), dayTypeSchema)
}

export async function replaceDayTypeBlocks(input: DayTypeBlocksInput) {
  const { id, ...body } = input
  return parse(
    await safeFetch(`${endpoint}/${id}/blocks`, json('PUT', body)),
    dayTypeSchema,
  )
}

export async function archiveDayType(input: DayTypeVersionInput) {
  await safeFetch(`${endpoint}/${input.id}?version=${input.version}`, { method: 'DELETE' })
}

export async function restoreDayType(input: DayTypeVersionInput) {
  return parse(
    await safeFetch(`${endpoint}/${input.id}/restore?version=${input.version}`, {
      method: 'POST',
    }),
    dayTypeSchema,
  )
}

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function parse<T>(response: Response, schema: zodSchema<T>): Promise<T> {
  const result = schema.safeParse(await response.json())
  if (!result.success) {
    throw new DayTypeClientError('Gün tipi API yanıtı beklenen sözleşmeyle eşleşmiyor.')
  }
  return result.data
}

interface zodSchema<T> {
  safeParse(value: unknown): { success: true; data: T } | { success: false }
}

async function safeFetch(url: string, init: RequestInit) {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    throw new DayTypeClientError(error instanceof Error ? error.message : 'Gün tipi API erişilemiyor.')
  }
  if (!response.ok) {
    let detail: string | undefined
    try {
      const problem: unknown = await response.json()
      if (typeof problem === 'object' && problem && 'detail' in problem && typeof problem.detail === 'string') {
        detail = problem.detail
      }
    } catch {
      detail = undefined
    }
    throw new DayTypeClientError(detail ?? `Gün tipi API HTTP ${response.status} yanıtı döndürdü.`, response.status)
  }
  return response
}
