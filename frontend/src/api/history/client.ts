import { historyDaysSchema, historyDetailSchema } from './types'
export async function getHistoryDays(from: string, to: string, signal?: AbortSignal) {
  const response = await fetch(`/api/v1/history?${new URLSearchParams({ from, to })}`, { signal })
  if (!response.ok) throw new Error(`Geçmiş API HTTP ${response.status}`)
  return historyDaysSchema.parse(await response.json())
}
export async function getHistoryDetail(date: string, signal?: AbortSignal) {
  const response = await fetch(`/api/v1/history/${date}`, { signal })
  if (!response.ok) throw new Error(`Geçmiş API HTTP ${response.status}`)
  return historyDetailSchema.parse(await response.json())
}
