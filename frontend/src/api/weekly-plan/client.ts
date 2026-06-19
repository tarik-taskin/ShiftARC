import {
  weeklyPlanSchema,
  WeeklyPlanClientError,
  type WeeklyPlanUpdateInput,
} from './types'

const endpoint = '/api/v1/weekly-plan'

export async function getWeeklyPlan(signal?: AbortSignal) {
  return request({ signal })
}

export async function updateWeeklyPlan(input: WeeklyPlanUpdateInput) {
  return request({
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

async function request(init: RequestInit) {
  let response: Response
  try {
    response = await fetch(endpoint, init)
  } catch (error) {
    throw new WeeklyPlanClientError(
      error instanceof Error ? error.message : 'Haftalık plan API erişilemiyor.',
    )
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
    throw new WeeklyPlanClientError(
      detail ?? `Haftalık plan API HTTP ${response.status} yanıtı döndürdü.`,
      response.status,
    )
  }
  const parsed = weeklyPlanSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new WeeklyPlanClientError('Haftalık plan yanıtı beklenen sözleşmeyle eşleşmiyor.')
  }
  return parsed.data
}
