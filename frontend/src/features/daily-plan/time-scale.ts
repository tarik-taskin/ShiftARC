export function focusWindow(minute: number) {
  const start = Math.max(0, Math.min(1080, Math.floor(minute) - 60))
  return { start, end: start + 360 }
}
export function createTimeScale(minute: number) {
  const { start, end } = focusWindow(minute)
  const compressedRate = 40 / 1080
  const position = (value: number) => {
    const time = Math.max(0, Math.min(1440, value))
    if (time <= start) return time * compressedRate
    if (time <= end) return start * compressedRate + (time - start) / 6
    return start * compressedRate + 60 + (time - end) * compressedRate
  }
  const segments = (from: number, to: number) => {
    const points = [from, ...[start, end].filter((point) => point > from && point < to), to]
    return points.slice(0, -1).map((point, index) => ({
      start: point, end: points[index + 1], left: position(point),
      width: position(points[index + 1]) - position(point),
    }))
  }
  return { start, end, position, segments }
}
export function workspaceDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}
export function workspaceTime(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  return { hour: value('hour'), minute: value('minute'), second: value('second') }
}
