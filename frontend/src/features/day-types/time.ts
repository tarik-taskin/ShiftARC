export function formatTime(minutes: number) {
  if (minutes === 1440) return '24:00'
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

const blockColors = [
  '#2563EB', '#7C3AED', '#DB2777', '#D97706',
  '#059669', '#0891B2', '#4F46E5', '#BE123C',
]

export function colorForBlock(index: number, unplanned = false) {
  return unplanned ? '#475569' : blockColors[index % blockColors.length]
}
