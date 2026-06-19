import {
  categoryListSchema,
  categorySchema,
  CategoryClientError,
  type Category,
  type CategoryInput,
  type CategoryUpdateInput,
  type CategoryVersionInput,
} from './types'

const endpoint = '/api/v1/categories'

export async function listCategories(
  includeArchived: boolean,
  search: string,
  signal?: AbortSignal,
): Promise<Category[]> {
  const params = new URLSearchParams({
    includeArchived: String(includeArchived),
    search,
  })
  return request(`${endpoint}?${params}`, categoryListSchema, { signal })
}

export function createCategory(input: CategoryInput) {
  return request(endpoint, categorySchema, jsonRequest('POST', input))
}

export function updateCategory(input: CategoryUpdateInput) {
  const { id, ...body } = input
  return request(`${endpoint}/${id}`, categorySchema, jsonRequest('PUT', body))
}

export async function archiveCategory(input: CategoryVersionInput) {
  await requestWithoutBody(
    `${endpoint}/${input.id}?version=${input.version}`,
    { method: 'DELETE' },
  )
}

export function restoreCategory(input: CategoryVersionInput) {
  return request(
    `${endpoint}/${input.id}/restore?version=${input.version}`,
    categorySchema,
    { method: 'POST' },
  )
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function request<T>(
  url: string,
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T } },
  init: RequestInit,
): Promise<T> {
  const response = await safeFetch(url, init)
  const parsed = schema.safeParse(await response.json())
  if (!parsed.success || parsed.data === undefined) {
    throw new CategoryClientError('Kategori API yanıtı beklenen sözleşmeyle eşleşmiyor.')
  }
  return parsed.data
}

async function requestWithoutBody(url: string, init: RequestInit) {
  await safeFetch(url, init)
}

async function safeFetch(url: string, init: RequestInit) {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    throw new CategoryClientError(
      error instanceof Error ? error.message : 'Kategori API erişilemiyor.',
    )
  }
  if (!response.ok) {
    let detail: string | undefined
    try {
      const problem: unknown = await response.json()
      if (
        typeof problem === 'object' &&
        problem !== null &&
        'detail' in problem &&
        typeof problem.detail === 'string'
      ) {
        detail = problem.detail
      }
    } catch {
      detail = undefined
    }
    throw new CategoryClientError(
      detail ?? `Kategori API HTTP ${response.status} yanıtı döndürdü.`,
      response.status,
    )
  }
  return response
}
