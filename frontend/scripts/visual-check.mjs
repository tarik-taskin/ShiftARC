import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.SHIFTARC_PLAYWRIGHT_MODULE || 'playwright')
const origin = process.env.SHIFTARC_VISUAL_URL || 'http://127.0.0.1:5173'
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname)) throw new Error('Visual checks require a loopback frontend.')
const output = path.resolve('test-results/visual')
await mkdir(output, { recursive: true })
const id = (n) => '10000000-0000-4000-8000-' + String(n).padStart(12, '0')
const date = '2026-09-06'
const categories = ['Derin çalışma', 'Öğrenme', 'Kişisel'].map((name, i) => ({ id: id(100 + i), name, color: ['#A9E5BB', '#F7B32B', '#722AF7'][i], icon: 'tag', archived: false, version: 0 }))
const tasks = ['Araştırma notlarını düzenle', 'Ürün tasarımı ve uzun Türkçe başlıkların okunurluğunu incele', 'Otuz dakika kitap oku', 'Haftanın değerlendirmesi'].map((title, i) => ({
  id: id(200 + i), type: i === 2 ? 'HABIT' : 'WORK_ITEM', title, description: 'Bir sonraki küçük adımı belirle ve ilerle.',
  importance: 4 - i % 3, status: 'ACTIVE', totalRequiredMinutes: i === 2 ? null : 180, deadline: i === 2 ? null : '2026-09-12',
  weeklyTargetMinutes: i === 2 ? 150 : null, dailyLimitMinutes: 60, executedMinutes: 30, remainingMinutes: 150,
  categories: [categories[i % 3]], stages: [{ id: id(300 + i), title: 'İlk taslak', position: 0, completed: false }],
  version: 0, completedAt: null, createdAt: date + 'T06:00:00Z', updatedAt: date + 'T06:00:00Z',
}))
const blocks = [[0, 480, 'Dinlenme'], [480, 720, 'Sabah çalışması'], [720, 780, 'Ara'], [780, 1080, 'Öğleden sonra'], [1080, 1440, 'Kişisel zaman']].map(([startMinute, endMinute, name], i) => ({
  id: id(400 + i), name, startMinute, endMinute, categoryIds: [categories[i % 3].id],
}))
const dayTypes = [{ id: id(500), name: 'Çalışma günü', color: '#47682C', archived: false, version: 0, blocks }, { id: id(501), name: 'Dinlenme günü', color: '#722AF7', archived: false, version: 0, blocks }]
const items = [[510, 570], [590, 710], [800, 805], [900, 960]].map(([start, end], i) => ({
  id: id(600 + i), taskId: tasks[i].id, taskTitle: tasks[i].title, taskStageTitle: 'İlk taslak', taskType: tasks[i].type,
  importance: tasks[i].importance, plannedStartMinute: start, plannedEndMinute: end, status: i === 0 ? 'COMPLETED' : i === 1 ? 'ACTIVE' : 'PLANNED', version: 0,
}))
const plan = { id: id(700), date, timezone: 'Europe/Istanbul', sourceDayTypeId: dayTypes[0].id, sourceDayTypeName: dayTypes[0].name, status: 'ACTIVE', version: 0, generatedAt: date + 'T05:00:00Z', blocks: blocks.map((block) => ({ ...block, items: items.filter((item) => item.plannedStartMinute >= block.startMinute && item.plannedEndMinute <= block.endMinute) })), warnings: [{ taskId: tasks[3].id, reasonCode: 'CAPACITY', unallocatedMinutes: 25, detail: 'Haftanın değerlendirmesi için 25 dakika uygun kapasite bulunamadı.' }] }
const active = { id: id(800), taskId: tasks[1].id, taskTitle: tasks[1].title, dailyPlanItemId: items[1].id, startedAt: date + 'T06:50:00Z', endedAt: null, version: 0, durationSeconds: 0 }
const sessions = [{ ...active, id: id(801), taskId: tasks[0].id, taskTitle: tasks[0].title, dailyPlanItemId: items[0].id, startedAt: date + 'T05:30:00Z', endedAt: date + 'T06:30:00Z', durationSeconds: 3600 }]
const summary = { date, planId: plan.id, dayTypeName: plan.sourceDayTypeName, status: 'ACTIVE', plannedMinutes: 245, executedMinutes: 60, completedItems: 1, totalItems: 4, sessionCount: 1 }
let workspace = { id: id(1), name: 'Örnek çalışma alanı', timezone: 'Europe/Istanbul', weekStartsOn: 1, themeId: 'amber', colorMode: 'LIGHT', clockStyle: 'DIGITAL', backgroundMode: 'STATIC', onboardingCompleted: true, version: 0 }
let scenario = 'normal'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
await context.route('**/api/v1/**', async (route) => {
  const url = new URL(route.request().url()), endpoint = url.pathname.replace('/api/v1', '')
  let body
  if (endpoint === '/workspace/settings') { workspace = { ...workspace, ...route.request().postDataJSON(), version: workspace.version + 1 }; body = workspace }
  else if (endpoint === '/workspace') body = workspace
  else if (endpoint === '/tasks') {
    if (scenario === 'error') return route.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ detail: 'Örnek bağlantı hatası' }) })
    body = scenario === 'empty' ? [] : scenario === 'dense' ? Array.from({ length: 24 }, (_, i) => ({ ...tasks[i % tasks.length], id: id(1000 + i) })) : tasks
  }
  else if (endpoint === '/categories') body = categories
  else if (endpoint === '/day-types') body = dayTypes
  else if (endpoint.startsWith('/day-types/')) body = dayTypes[0]
  else if (endpoint === '/daily-plan/today') body = scenario === 'empty-plan' ? { ...plan, blocks: plan.blocks.map((block) => ({ ...block, items: [] })), warnings: [] } : plan
  else if (endpoint === '/execution/today') body = { date, timezone: workspace.timezone, activeSession: scenario === 'empty-plan' ? null : active, sessions: scenario === 'empty-plan' ? [] : sessions }
  else if (endpoint === '/weekly-plan') body = { version: 0, complete: true, days: Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, dayType: { ...dayTypes[i > 4 ? 1 : 0], blockCount: blocks.length } })) }
  else if (endpoint === '/history') body = [summary]
  else if (endpoint.startsWith('/history/')) body = { summary, plan, sessions, events: [] }
  else if (endpoint === '/pomodoro') body = { settings: { focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4, version: 0 }, activeSession: { id: id(900), phase: 'FOCUS', status: 'ACTIVE', durationMinutes: 25, taskId: tasks[1].id, taskTitle: tasks[1].title, startedAt: date + 'T07:00:00Z', plannedEndAt: date + 'T07:25:00Z', endedAt: null, version: 0 }, recentSessions: [], focusCyclesToday: 2 }
  else body = []
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
})
const page = await context.newPage()
await page.clock.install({ time: new Date(date + 'T07:12:00Z') })
const problems = []
const contrasts = []
let screenshotCount = 0
page.on('pageerror', (error) => problems.push(error.message))
async function visit(route, heading) {
  await page.goto(origin + route)
  try { await page.getByRole('heading', { name: heading, exact: true }).first().waitFor({ timeout: 12000 }) }
  catch (error) { await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }); console.log(await page.locator('body').innerText()); console.log(problems); await browser.close(); throw error }
  await page.evaluate(() => document.fonts.ready)
}
async function capture(name) {
  screenshotCount++
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
  if (overflow) problems.push(name + ': page overflows horizontally')
  await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true })
}
for (const theme of ['amber', 'ion', 'grove']) for (const mode of ['LIGHT', 'DARK']) {
  workspace = { ...workspace, themeId: theme, colorMode: mode }
  await page.setViewportSize({ width: 1440, height: 900 })
  await visit('/', 'Bugün'); await capture(theme + '-' + mode + '-today')
  const ratios = await page.evaluate(() => {
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
    canvas.width = canvas.height = 1
    const resolve = (token) => {
      const node = document.createElement('span')
      node.style.color = 'var(' + token + ')'
      document.body.append(node)
      const color = getComputedStyle(node).color
      node.remove()
      ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1)
      const rgb = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
        const c = value / 255
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
    }
    return [['--foreground', '--background'], ['--muted-foreground', '--card'], ['--primary-foreground', '--primary'], ['--destructive-foreground', '--destructive']].map(([fg, bg]) => {
      const a = resolve(fg), b = resolve(bg)
      return { fg, bg, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
    })
  })
  contrasts.push({ theme, mode, ratios })
  for (const check of ratios) if (check.ratio < 4.5) problems.push(theme + '-' + mode + ': contrast ' + check.fg + ' = ' + check.ratio.toFixed(2))

  await visit('/tasks', 'Görevler'); await capture(theme + '-' + mode + '-tasks')
  await page.getByRole('button', { name: 'Yeni görev', exact: true }).last().click()
  await page.getByRole('dialog', { name: 'Yeni görev' }).waitFor()
  await capture(theme + '-' + mode + '-dialog')
}
workspace = { ...workspace, themeId: 'amber', colorMode: 'LIGHT' }
for (const width of [360, 768, 1024, 1440]) {
  await page.setViewportSize({ width, height: 900 })
  for (const [route, heading] of [['/', 'Bugün'], ['/tasks', 'Görevler'], ['/day-types', 'Gün tipleri'], ['/week', 'Haftalık plan'], ['/calendar', 'Planlama takvimi'], ['/history', 'Geçmiş'], ['/categories', 'Kategoriler'], ['/triggers', 'Triggerlar'], ['/focus', 'Odak sayacı'], ['/settings/preferences', 'Görünüm']]) {
    await visit(route, heading); await capture(width + '-' + (route.replaceAll('/', '-') || 'today'))
  }
  await visit('/tasks', 'Görevler')
  await page.getByRole('button', { name: 'Yeni görev', exact: true }).last().click()
  await capture(width + '-task-dialog')
}
for (const style of ['DIGITAL', 'DIAL', 'SEGMENT']) {
  workspace = { ...workspace, clockStyle: style }
  await visit('/', 'Bugün')
  await capture('clock-' + style)
}
for (const state of ['empty', 'error']) {
  scenario = state
  await visit('/tasks', 'Görevler')
  await page.getByText(state === 'empty' ? 'Bu görünümde görev yok' : 'Görevler yüklenemedi', { exact: true }).waitFor()
  await capture('tasks-' + state)
}
scenario = 'dense'
await visit('/tasks', 'Görevler'); await capture('tasks-dense')
scenario = 'empty-plan'
await visit('/', 'Bugün'); await capture('today-empty')
scenario = 'normal'
workspace = { ...workspace, onboardingCompleted: false }
for (const width of [360, 1440]) {
  await page.setViewportSize({ width, height: 900 })
  await visit('/', 'Çalışma alanını kendine uydur.')
  await capture(width + '-onboarding')
}
await writeFile(path.join(output, 'results.json'), JSON.stringify({ problems, contrasts, screenshots: screenshotCount }, null, 2))
await browser.close()
if (problems.length) throw new Error(problems.join('; '))
console.log('Visual checks passed; screenshots saved to ' + output)
