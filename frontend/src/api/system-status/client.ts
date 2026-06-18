import {
  SYSTEM_COMPONENT_STATUS,
  SystemStatusClientError,
  type SystemStatusResponse,
} from './types'

const SYSTEM_STATUS_ENDPOINT = '/api/v1/system/status'
const DEFAULT_TIMEOUT_MS = 5_000

interface GetSystemStatusOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export async function getSystemStatus(
  options: GetSystemStatusOptions = {},
): Promise<SystemStatusResponse> {
  const requestController = new AbortController()
  let didTimeout = false

  const abortFromCaller = () => requestController.abort(options.signal?.reason)
  if (options.signal?.aborted) {
    abortFromCaller()
  } else {
    options.signal?.addEventListener('abort', abortFromCaller, { once: true })
  }

  const timeoutId = window.setTimeout(() => {
    didTimeout = true
    requestController.abort()
  }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    let response: Response
    try {
      response = await fetch(SYSTEM_STATUS_ENDPOINT, {
        headers: {
          Accept: 'application/json',
        },
        signal: requestController.signal,
      })
    } catch (error) {
      if (didTimeout) {
        throw new SystemStatusClientError(
          'timeout',
          'The system status request timed out.',
          { cause: error },
        )
      }

      if (options.signal?.aborted) {
        throw new SystemStatusClientError(
          'aborted',
          'The system status request was cancelled.',
          { cause: error },
        )
      }

      throw new SystemStatusClientError(
        'network',
        'The ShiftARC API could not be reached.',
        { cause: error },
      )
    }

    if (!response.ok) {
      const detail = await readProblemDetail(response)
      throw new SystemStatusClientError(
        'http',
        detail ?? `The ShiftARC API returned HTTP ${response.status}.`,
        { statusCode: response.status },
      )
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch (error) {
      throw new SystemStatusClientError(
        'invalid-response',
        'The ShiftARC API returned invalid JSON.',
        { cause: error },
      )
    }

    if (!isSystemStatusResponse(payload)) {
      throw new SystemStatusClientError(
        'invalid-response',
        'The ShiftARC API response does not match the system status contract.',
      )
    }

    return payload
  } finally {
    window.clearTimeout(timeoutId)
    options.signal?.removeEventListener('abort', abortFromCaller)
  }
}

async function readProblemDetail(response: Response): Promise<string | undefined> {
  try {
    const payload: unknown = await response.json()
    if (isRecord(payload) && typeof payload.detail === 'string') {
      return payload.detail
    }
  } catch {
    return undefined
  }

  return undefined
}

function isSystemStatusResponse(value: unknown): value is SystemStatusResponse {
  return (
    isRecord(value) &&
    typeof value.service === 'string' &&
    value.service.trim().length > 0 &&
    typeof value.version === 'string' &&
    value.version.trim().length > 0 &&
    value.status === SYSTEM_COMPONENT_STATUS.up &&
    value.database === SYSTEM_COMPONENT_STATUS.up
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
