import { useCallback, useEffect, useRef, useState } from 'react'

import { getSystemStatus } from './client'
import {
  SystemStatusClientError,
  type SystemStatusRequestState,
} from './types'

interface UseSystemStatusResult {
  state: SystemStatusRequestState
  refresh: () => void
}

export function useSystemStatus(): UseSystemStatusResult {
  const [state, setState] = useState<SystemStatusRequestState>({
    phase: 'loading',
  })
  const activeRequest = useRef<AbortController | null>(null)
  const requestSequence = useRef(0)

  const refresh = useCallback(() => {
    activeRequest.current?.abort()

    const requestController = new AbortController()
    const requestId = ++requestSequence.current
    activeRequest.current = requestController
    setState({ phase: 'loading' })

    void getSystemStatus({ signal: requestController.signal })
      .then((data) => {
        if (requestId === requestSequence.current) {
          setState({ phase: 'success', data })
        }
      })
      .catch((error: unknown) => {
        if (requestController.signal.aborted) {
          return
        }

        const clientError =
          error instanceof SystemStatusClientError
            ? error
            : new SystemStatusClientError(
                'network',
                'An unexpected error occurred while checking system status.',
                { cause: error },
              )

        if (requestId === requestSequence.current) {
          setState({ phase: 'error', error: clientError })
        }
      })
  }, [])

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) {
        refresh()
      }
    })

    return () => {
      cancelled = true
      requestSequence.current += 1
      activeRequest.current?.abort()
    }
  }, [refresh])

  return { state, refresh }
}
