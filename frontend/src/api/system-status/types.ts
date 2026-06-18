export const SYSTEM_COMPONENT_STATUS = {
  up: 'UP',
} as const

export type SystemComponentStatus =
  (typeof SYSTEM_COMPONENT_STATUS)[keyof typeof SYSTEM_COMPONENT_STATUS]

export interface SystemStatusResponse {
  service: string
  version: string
  status: SystemComponentStatus
  database: SystemComponentStatus
}

export type SystemStatusErrorKind =
  | 'aborted'
  | 'timeout'
  | 'network'
  | 'http'
  | 'invalid-response'

export class SystemStatusClientError extends Error {
  readonly kind: SystemStatusErrorKind
  readonly statusCode?: number

  constructor(
    kind: SystemStatusErrorKind,
    message: string,
    options?: { cause?: unknown; statusCode?: number },
  ) {
    super(message, { cause: options?.cause })
    this.name = 'SystemStatusClientError'
    this.kind = kind
    this.statusCode = options?.statusCode
  }
}

export type SystemStatusRequestState =
  | { phase: 'loading' }
  | { phase: 'success'; data: SystemStatusResponse }
  | { phase: 'error'; error: SystemStatusClientError }
