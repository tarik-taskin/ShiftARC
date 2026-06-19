import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { SystemStatusClientError } from './api/system-status/types'

const { mockUseSystemStatus } = vi.hoisted(() => ({
  mockUseSystemStatus: vi.fn(),
}))

vi.mock('./api/system-status/useSystemStatus', () => ({
  useSystemStatus: mockUseSystemStatus,
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
  afterEach(() => {
    cleanup()
  })

  it('renders the product navigation and today workspace', () => {
    window.history.pushState({}, '', '/')

    renderApp()

    expect(
      screen.getByRole('heading', { name: 'Bugünün ritmini kur.' }),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('navigation', { name: 'Ana navigasyon' })).getByRole(
        'link',
        { name: 'Gün tipleri' },
      ),
    ).toHaveAttribute('href', '/day-types')
    expect(
      screen.getByRole('link', { name: 'Sistem durumunu aç' }),
    ).toHaveAttribute('href', '/settings/system')
  })
})
