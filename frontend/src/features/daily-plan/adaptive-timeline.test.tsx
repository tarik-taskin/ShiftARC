import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { DailyPlan } from '@/api/daily-plan/types'
import { AdaptiveTimeline } from './adaptive-timeline'

const plan: DailyPlan = {
  id: 'plan', date: '2026-09-06', timezone: 'Europe/Istanbul', sourceDayTypeId: 'day',
  sourceDayTypeName: 'Çalışma', status: 'ACTIVE', version: 1, generatedAt: '', warnings: [],
  blocks: [{ id: 'block', name: 'Çalışma bloğu', startMinute: 0, endMinute: 1440, items: [
    { id: 'item', taskId: 'task', taskTitle: 'Uzun görev başlığı', taskStageTitle: 'İlk aşama', taskType: 'WORK_ITEM', importance: 3, plannedStartMinute: 670, plannedEndMinute: 675, status: 'PLANNED', version: 0 },
  ] }],
}
afterEach(cleanup)
describe('adaptive timeline interactions', () => {
  it('exposes full details for a narrow five-minute task', () => {
    render(<AdaptiveTimeline plan={plan} minute={720} />)
    fireEvent.click(screen.getByRole('button', { name: /Uzun görev başlığı/ }))
    expect(screen.getByRole('heading', { name: 'Uzun görev başlığı' })).toBeInTheDocument()
    expect(screen.getByText(/İlk aşama · Çalışma bloğu · 11:10–11:15 · 5 dk/)).toBeInTheDocument()
  })
  it('freezes scale during pointer and keyboard interaction and editing', () => {
    const { rerender } = render(<AdaptiveTimeline plan={plan} minute={720} />)
    const button = screen.getByRole('button', { name: /Çalışma bloğu/ })
    fireEvent.pointerEnter(button.parentElement!.parentElement!.parentElement!)
    rerender(<AdaptiveTimeline plan={plan} minute={721} />)
    expect(screen.getByText('11:00–17:00')).toBeInTheDocument()
    fireEvent.pointerLeave(button.parentElement!.parentElement!.parentElement!)
    fireEvent.focus(button)
    rerender(<AdaptiveTimeline plan={plan} minute={722} />)
    expect(screen.getByText('11:01–17:01')).toBeInTheDocument()
    fireEvent.blur(button)
    rerender(<AdaptiveTimeline plan={plan} minute={723} frozen />)
    expect(screen.getByText('11:02–17:02')).toBeInTheDocument()
  })
})
