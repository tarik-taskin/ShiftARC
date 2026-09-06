import type { ClockStyle } from '@/api/workspace/types'
import { workspaceTime } from '@/features/daily-plan/time-scale'

const digits = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg']
const segments = { a: [5, 2, 20, 4], b: [25, 7, 4, 20], c: [25, 32, 4, 20], d: [5, 53, 20, 4], e: [1, 32, 4, 20], f: [1, 7, 4, 20], g: [5, 28, 20, 4] } as const
export function Clock({ now, timezone, style = 'DIGITAL', compact = false }: { now: Date; timezone: string; style?: ClockStyle; compact?: boolean }) {
  const time = workspaceTime(now, timezone)
  const hour = String(time.hour).padStart(2, '0'), minute = String(time.minute).padStart(2, '0'), second = String(time.second).padStart(2, '0')
  const label = hour + ':' + minute
  return <div role="timer" aria-live="off" aria-label={'Saat ' + label} className="flex items-center justify-center gap-3">
    {style === 'DIAL' ? <svg viewBox="0 0 100 100" className={compact ? 'size-16' : 'size-20'} aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="var(--card)" stroke="var(--border)" />
      {[12, 3, 6, 9].map((number, i) => <text key={number} x={[50, 86, 50, 14][i]} y={[18, 54, 89, 54][i]} textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="Manrope">{number}</text>)}
      <line x1="50" y1="50" x2="50" y2="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform={'rotate(' + (time.hour % 12 * 30 + time.minute / 2) + ' 50 50)'} />
      <line x1="50" y1="50" x2="50" y2="17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" transform={'rotate(' + time.minute * 6 + ' 50 50)'} />
      <circle cx="50" cy="50" r="3" fill="var(--primary)" />
    </svg> : null}
    {style === 'SEGMENT' ? <div className="flex items-end gap-2" aria-hidden="true"><svg viewBox="0 0 151 59" className={compact ? 'h-9 w-24' : 'h-12 w-32'}>
      {[...hour, ...minute].map((digit, index) => <g key={index} transform={'translate(' + (index * 35 + (index >= 2 ? 11 : 0)) + ' 0)'}>{Object.entries(segments).map(([key, [x, y, width, height]]) => <rect key={key} x={x} y={y} width={width} height={height} rx="1" fill="currentColor" opacity={digits[Number(digit)].includes(key) ? 1 : 0.07} />)}</g>)}
      <circle cx="72" cy="20" r="2" fill="var(--primary)" /><circle cx="72" cy="40" r="2" fill="var(--primary)" />
    </svg><span className="font-mono text-xs text-muted-foreground">{second}</span></div>
    : <div aria-hidden="true"><p className={'font-mono tracking-tight ' + (compact ? 'text-xl' : 'text-3xl')}>{label}<span className="ml-2 text-xs text-muted-foreground">{second}</span></p>{!compact ? <p className="mt-1 text-right text-xs text-muted-foreground">{new Intl.DateTimeFormat('tr-TR', { timeZone: timezone, day: 'numeric', month: 'short' }).format(now)}</p> : null}</div>}
  </div>
}
