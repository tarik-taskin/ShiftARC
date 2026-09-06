export function formatTime(minutes: number) {
  if (minutes === 1440) return '24:00'
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

const blockColors = ['--primary', '--info', '--success', '--warning']
export function colorForBlock(index: number, unplanned = false) {
  return unplanned ? 'var(--muted-foreground)' : 'var(' + blockColors[index % blockColors.length] + ')'
}
