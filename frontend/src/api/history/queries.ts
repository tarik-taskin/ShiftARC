import { useQuery } from '@tanstack/react-query'
import { getHistoryDays, getHistoryDetail } from './client'
export function useHistoryDays(from: string, to: string) { return useQuery({ queryKey: ['history', from, to], queryFn: ({ signal }) => getHistoryDays(from, to, signal) }) }
export function useHistoryDetail(date: string | null) { return useQuery({ queryKey: ['history-detail', date], queryFn: ({ signal }) => getHistoryDetail(date!, signal), enabled: Boolean(date) }) }
