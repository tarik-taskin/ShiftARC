import { describe, expect, it } from 'vitest'
import { createTimeScale, focusWindow, workspaceDate, workspaceTime } from './time-scale'
describe('adaptive daily time scale', () => {
  it('expands the preceding hour and next five hours to sixty percent', () => {
    const scale = createTimeScale(720)
    expect(scale.start).toBe(660)
    expect(scale.end).toBe(1020)
    expect(scale.position(scale.end) - scale.position(scale.start)).toBeCloseTo(60)
    expect(scale.position(0)).toBe(0)
    expect(scale.position(1440)).toBeCloseTo(100)
  })
  it('keeps six hours within the snapshot at both day boundaries', () => {
    expect(focusWindow(15)).toEqual({ start: 0, end: 360 })
    expect(focusWindow(1439)).toEqual({ start: 1080, end: 1440 })
  })
  it('splits crossing items without losing duration or continuity', () => {
    const scale = createTimeScale(720)
    const parts = scale.segments(600, 1080)
    expect(parts).toHaveLength(3)
    expect(parts.reduce((sum, part) => sum + part.end - part.start, 0)).toBe(480)
    expect(parts.reduce((sum, part) => sum + part.width, 0)).toBeCloseTo(scale.position(1080) - scale.position(600))
    expect(scale.segments(670, 675)[0].width).toBeCloseTo(5 / 6)
  })
  it('is continuous and monotonic throughout the day', () => {
    for (const minute of [0, 59, 300, 720, 1200, 1439]) {
      const scale = createTimeScale(minute)
      for (let time = 1; time <= 1440; time++) expect(scale.position(time)).toBeGreaterThan(scale.position(time - 1))
    }
  })
  it('resolves time and rollover in the workspace timezone', () => {
    const date = new Date('2026-09-06T22:30:00Z')
    expect(workspaceDate(date, 'Europe/Istanbul')).toBe('2026-09-07')
    expect(workspaceTime(date, 'Europe/Istanbul').hour).toBe(1)
    expect(workspaceDate(date, 'America/New_York')).toBe('2026-09-06')
  })
})
