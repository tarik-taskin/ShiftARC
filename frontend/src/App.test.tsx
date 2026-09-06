import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { SystemStatusClientError } from './api/system-status/types'

const {
  mockUseSystemStatus,
  mockUseWorkspace,
  mockUseCompleteOnboarding,
  mockUseUpdateWorkspaceSettings,
  mockUseTodayPlan,
  mockUseRegenerateTodayPlan,
  mockUseAdjustTodayPlanItem,
  mockUseExecutionState,
  mockUseStartExecution,
  mockUseFinishExecution,
  mockUseTransitionExecution,
  mockUseCorrectExecutionTimes,
  mockUseTriggers,
  mockUseCompleteTrigger,
} = vi.hoisted(() => ({
  mockUseSystemStatus: vi.fn(),
  mockUseWorkspace: vi.fn(),
  mockUseCompleteOnboarding: vi.fn(),
  mockUseUpdateWorkspaceSettings: vi.fn(),
  mockUseTodayPlan: vi.fn(),
  mockUseRegenerateTodayPlan: vi.fn(),
  mockUseAdjustTodayPlanItem: vi.fn(),
  mockUseExecutionState: vi.fn(),
  mockUseStartExecution: vi.fn(),
  mockUseFinishExecution: vi.fn(),
  mockUseTransitionExecution: vi.fn(),
  mockUseCorrectExecutionTimes: vi.fn(),
  mockUseTriggers: vi.fn(),
  mockUseCompleteTrigger: vi.fn(),
}))

vi.mock('./api/system-status/useSystemStatus', () => ({
  useSystemStatus: mockUseSystemStatus,
}))

vi.mock('./api/workspace/queries', () => ({
  useWorkspace: mockUseWorkspace,
  useCompleteOnboarding: mockUseCompleteOnboarding,
  useUpdateWorkspaceSettings: mockUseUpdateWorkspaceSettings,
}))

vi.mock('./api/daily-plan/queries', () => ({
  useTodayPlan: mockUseTodayPlan,
  useRegenerateTodayPlan: mockUseRegenerateTodayPlan,
  useAdjustTodayPlanItem: mockUseAdjustTodayPlanItem,
}))

vi.mock('./api/execution/queries', () => ({
  useExecutionState: mockUseExecutionState,
  useStartExecution: mockUseStartExecution,
  useFinishExecution: mockUseFinishExecution,
  useTransitionExecution: mockUseTransitionExecution,
  useCorrectExecutionTimes: mockUseCorrectExecutionTimes,
}))

vi.mock('./api/triggers/queries', () => ({
  useTriggers: mockUseTriggers,
  useCompleteTrigger: mockUseCompleteTrigger,
}))

describe('foundation status screen', () => {
  const refresh = vi.fn()

  beforeEach(() => {
    mockUseSystemStatus.mockReset()
    refresh.mockReset()
    window.history.pushState({}, '', '/settings/system')
  })

  afterEach(() => {
    cleanup()
  })

  it('shows loading states while checking services', () => {
    mockUseSystemStatus.mockReturnValue({
      state: { phase: 'loading' },
      refresh,
    })

    renderApp()

    expect(
      screen.getByRole('heading', { name: 'Bağlantılar kontrol ediliyor' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Kontrol ediliyor' }),
    ).toBeDisabled()
    expect(
      within(getStatusCard('Spring Boot')).getByText('Kontrol ediliyor'),
    ).toBeInTheDocument()
    expect(
      within(getStatusCard('PostgreSQL 16')).getByText('Kontrol ediliyor'),
    ).toBeInTheDocument()
  })

  it('shows all services as ready after a successful check', () => {
    mockUseSystemStatus.mockReturnValue({
      state: {
        phase: 'success',
        data: {
          service: 'shiftarc-api',
          version: '0.1.0',
          status: 'UP',
          database: 'UP',
        },
      },
      refresh,
    })

    renderApp()

    expect(
      screen.getByRole('heading', { name: 'Tüm servisler hazır' }),
    ).toBeInTheDocument()
    expect(
      within(getStatusCard('Spring Boot')).getByText('shiftarc-api · v0.1.0'),
    ).toBeInTheDocument()
    expect(
      within(getStatusCard('PostgreSQL 16')).getByText('Bağlı'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('separates an available API from an unavailable database', () => {
    mockUseSystemStatus.mockReturnValue({
      state: {
        phase: 'error',
        error: new SystemStatusClientError(
          'http',
          'The database is temporarily unavailable.',
          { statusCode: 503 },
        ),
      },
      refresh,
    })

    renderApp()

    expect(
      within(getStatusCard('Spring Boot')).getByText('Yanıt veriyor'),
    ).toBeInTheDocument()
    expect(
      within(getStatusCard('PostgreSQL 16')).getByText('Bağlantı yok'),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'API çalışıyor ancak PostgreSQL bağlantısı kurulamadı.',
    )
  })

  it('retries the system check on user request', async () => {
    mockUseSystemStatus.mockReturnValue({
      state: {
        phase: 'error',
        error: new SystemStatusClientError(
          'network',
          'The ShiftARC API could not be reached.',
        ),
      },
      refresh,
    })
    const user = userEvent.setup()

    renderApp()
    await user.click(
      screen.getByRole('button', { name: 'Yeniden kontrol et' }),
    )

    expect(refresh).toHaveBeenCalledTimes(1)
  })
})

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  )
}

function getStatusCard(heading: string): HTMLElement {
  const card = screen.getByRole('heading', { name: heading }).closest('article')
  if (!card) {
    throw new Error(`Status card not found for ${heading}`)
  }

  return card
}

describe('product application shell', () => {
  beforeEach(() => {
    mockUseWorkspace.mockReturnValue({
      data: workspaceFixture({ onboardingCompleted: true }),
      isPending: false,
      isError: false,
    })
    mockUseCompleteOnboarding.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      error: null,
    })
    mockUseUpdateWorkspaceSettings.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
      error: null,
    })
    mockUseTodayPlan.mockReturnValue({ data: dailyPlanFixture(), isPending: false, isError: false })
    mockUseRegenerateTodayPlan.mockReturnValue({ mutate: vi.fn(), isPending: false })
    mockUseAdjustTodayPlanItem.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, error: null })
    mockUseExecutionState.mockReturnValue({ data: { activeSession: null, sessions: [] } })
    mockUseStartExecution.mockReturnValue({ mutate: vi.fn(), isPending: false })
    mockUseFinishExecution.mockReturnValue({ mutate: vi.fn(), isPending: false })
    mockUseTransitionExecution.mockReturnValue({ mutate: vi.fn(), isPending: false })
    mockUseCorrectExecutionTimes.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    mockUseTriggers.mockReturnValue({ data: [], isPending: false, isError: false })
    mockUseCompleteTrigger.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the product navigation and today workspace', () => {
    window.history.pushState({}, '', '/')

    renderApp()

    expect(screen.getByRole('heading', { name: 'Bugün', level: 1 })).toBeInTheDocument()
    expect(
      within(screen.getByRole('navigation', { name: 'Ana navigasyon' })).getByRole(
        'link',
        { name: 'Gün tipleri' },
      ),
    ).toHaveAttribute('href', '/day-types')
    expect(
      screen.getByRole('link', { name: 'Sistem durumu' }),
    ).toHaveAttribute('href', '/settings/system')
  })

  it('opens additional mobile destinations and closes after navigation', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/')
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Diğer' }))
    const menu = screen.getByRole('dialog', { name: 'Tüm sayfalar' })
    await user.click(within(menu).getByRole('link', { name: 'Görünüm' }))
    expect(screen.queryByRole('dialog', { name: 'Tüm sayfalar' })).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/settings/preferences')
  })

  it('shows onboarding before exposing the product workspace', async () => {
    mockUseWorkspace.mockReturnValue({
      data: workspaceFixture({ onboardingCompleted: false }),
      isPending: false,
      isError: false,
    })
    window.history.pushState({}, '', '/')

    renderApp()

    expect(
      await screen.findByRole('heading', {
        name: 'Çalışma alanını kendine uydur.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'ShiftARC’ı hazırla' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Ana navigasyon' }),
    ).not.toBeInTheDocument()
  })

  it('exposes persisted appearance preferences after onboarding', () => {
    window.history.pushState({}, '', '/settings/preferences')

    renderApp()

    expect(
      screen.getByRole('heading', { name: 'Görünüm' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Kehribar: Krem, mürdüm ve sıcak altın.',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('previews appearance and restores saved colors when leaving without saving', async () => {
    const user = userEvent.setup()
    window.history.pushState({}, '', '/settings/preferences')
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Koyu' }))
    expect(document.documentElement.dataset.colorMode).toBe('DARK')
    await user.click(within(screen.getByRole('navigation', { name: 'Ana navigasyon' })).getByRole('link', { name: 'Bugün' }))
    expect(document.documentElement.dataset.colorMode).toBe('LIGHT')
  })

  it('saves independent palette, color and clock choices with the workspace version', async () => {
    const user = userEvent.setup()
    const save = vi.fn().mockResolvedValue(workspaceFixture({ themeId: 'grove', colorMode: 'DARK', clockStyle: 'SEGMENT' }))
    mockUseUpdateWorkspaceSettings.mockReturnValue({ mutateAsync: save, isPending: false, isSuccess: false })
    window.history.pushState({}, '', '/settings/preferences')
    renderApp()
    await user.click(screen.getByRole('button', { name: /^Koruluk:/ }))
    await user.click(screen.getByRole('button', { name: 'Koyu' }))
    await user.click(screen.getByRole('button', { name: 'Segmentli' }))
    await user.click(screen.getByRole('button', { name: 'Tercihleri kaydet' }))
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ themeId: 'grove', colorMode: 'DARK', clockStyle: 'SEGMENT', version: 0 }))
  })

  it('shows controls for an active task execution', () => {
    mockUseExecutionState.mockReturnValue({
      data: {
        activeSession: {
          id: '81000000-0000-0000-0000-000000000001',
          taskId: '61000000-0000-0000-0000-000000000001',
          taskTitle: 'ML Dersi',
          dailyPlanItemId: '73000000-0000-0000-0000-000000000001',
          startedAt: new Date(Date.now() - 60_000).toISOString(),
          endedAt: null,
          version: 0,
          durationSeconds: 60,
        },
        sessions: [],
      },
    })
    window.history.pushState({}, '', '/')

    renderApp()

    expect(screen.getByText('Aktif çalışma')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bitir' })).toBeInTheDocument()
  })

  it('opens time correction for a completed execution', async () => {
    mockUseExecutionState.mockReturnValue({
      data: {
        activeSession: null,
        sessions: [{
          id: '81000000-0000-0000-0000-000000000001',
          taskId: '61000000-0000-0000-0000-000000000001',
          taskTitle: 'ML Dersi',
          dailyPlanItemId: '73000000-0000-0000-0000-000000000001',
          startedAt: '2026-06-19T10:00:00Z',
          endedAt: '2026-06-19T10:30:00Z',
          version: 0,
          durationSeconds: 1_800,
        }],
      },
    })
    window.history.pushState({}, '', '/')
    const user = userEvent.setup()

    renderApp()
    await user.click(
      screen.getByRole('button', { name: 'ML Dersi zamanını düzelt' }),
    )

    expect(
      screen.getByRole('dialog', { name: 'Çalışma zamanını düzelt' }),
    ).toBeInTheDocument()
  })

  it('opens the daily duration and priority adjustment', async () => {
    window.history.pushState({}, '', '/')
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'ML Dersi günlük planını ayarla' }))

    expect(screen.getByRole('dialog', { name: 'Günlük görevi ayarla' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Süre (dakika)' })).toHaveValue('1440')
  })
})

function workspaceFixture(overrides: Partial<import('./api/workspace/types').Workspace>) {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Lokal Çalışma Alanı',
    timezone: 'Europe/Istanbul',
    weekStartsOn: 1,
    colorMode: 'LIGHT' as const,
    clockStyle: 'DIGITAL' as const,
    themeId: 'amber' as const,
    backgroundMode: 'TIME_AWARE' as const,
    onboardingCompleted: overrides.onboardingCompleted,
    version: 0,
  }
}

function dailyPlanFixture() {
  return {
    id: '71000000-0000-0000-0000-000000000001', date: '2026-06-19', timezone: 'Europe/Istanbul',
    sourceDayTypeId: '51000000-0000-0000-0000-000000000001', sourceDayTypeName: 'İş Günü', status: 'ACTIVE' as const,
    version: 0, generatedAt: '2026-06-19T10:00:00Z', warnings: [], blocks: [{
      id: '72000000-0000-0000-0000-000000000001', name: 'İş', startMinute: 0, endMinute: 1440,
      items: [{ id: '73000000-0000-0000-0000-000000000001', taskId: '61000000-0000-0000-0000-000000000001', taskTitle: 'ML Dersi', taskStageTitle: null, taskType: 'WORK_ITEM' as const, importance: 5, plannedStartMinute: 0, plannedEndMinute: 1440, status: 'PLANNED' as const, version: 0 }],
    }],
  }
}
