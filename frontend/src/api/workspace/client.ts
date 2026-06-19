import {
  workspaceSchema,
  WorkspaceClientError,
  type OnboardingInput,
  type Workspace,
  type WorkspacePreferencesInput,
} from './types'

const workspaceEndpoint = '/api/v1/workspace'

export async function getWorkspace(signal?: AbortSignal): Promise<Workspace> {
  return requestWorkspace(workspaceEndpoint, { signal })
}

export async function completeOnboarding(
  input: OnboardingInput,
): Promise<Workspace> {
  return requestWorkspace('/api/v1/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function updateWorkspaceSettings(
  input: WorkspacePreferencesInput,
): Promise<Workspace> {
  return requestWorkspace(`${workspaceEndpoint}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

async function requestWorkspace(
  endpoint: string,
  init: RequestInit,
): Promise<Workspace> {
  let response: Response
  try {
    response = await fetch(endpoint, init)
  } catch (error) {
    throw new WorkspaceClientError(
      error instanceof Error ? error.message : 'Workspace API erişilemiyor.',
    )
  }

  if (!response.ok) {
    const detail = await readProblemDetail(response)
    throw new WorkspaceClientError(
      detail ?? `Workspace API HTTP ${response.status} yanıtı döndürdü.`,
      response.status,
    )
  }

  const parsed = workspaceSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new WorkspaceClientError('Workspace API yanıtı beklenen sözleşmeyle eşleşmiyor.')
  }
  return parsed.data
}

async function readProblemDetail(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      'detail' in body &&
      typeof body.detail === 'string'
    ) {
      return body.detail
    }
  } catch {
    return undefined
  }
  return undefined
}
