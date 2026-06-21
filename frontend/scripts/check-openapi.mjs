import { readFile } from 'node:fs/promises'

import { parse } from 'yaml'

const contractUrl = new URL('../../contracts/openapi/shiftarc-api.yaml', import.meta.url)
const packageUrl = new URL('../package.json', import.meta.url)
const contract = parse(await readFile(contractUrl, 'utf8'))
const packageJson = JSON.parse(await readFile(packageUrl, 'utf8'))

if (contract.openapi !== '3.1.0') {
  throw new Error(`Expected OpenAPI 3.1.0, received ${contract.openapi}`)
}

if (contract.info?.version !== packageJson.version) {
  throw new Error(
    `OpenAPI version ${contract.info?.version} does not match frontend ${packageJson.version}`,
  )
}

for (const path of [
  '/api/v1/categories',
  '/api/v1/categories/{id}',
  '/api/v1/categories/{id}/restore',
  '/api/v1/day-types',
  '/api/v1/day-types/{id}',
  '/api/v1/day-types/{id}/restore',
  '/api/v1/day-types/{id}/blocks',
  '/api/v1/weekly-plan',
  '/api/v1/tasks',
  '/api/v1/tasks/{id}',
  '/api/v1/tasks/{id}/status/{status}',
  '/api/v1/daily-plan/today',
  '/api/v1/daily-plan/today/regenerate',
  '/api/v1/daily-plan/today/items/{itemId}',
  '/api/v1/execution/today',
  '/api/v1/execution/start',
  '/api/v1/execution/finish',
  '/api/v1/execution/transition',
  '/api/v1/execution/sessions/{id}/times',
  '/api/v1/triggers',
  '/api/v1/triggers/{id}',
  '/api/v1/triggers/{id}/complete',
  '/api/v1/triggers/{id}/status/{status}',
  '/api/v1/pomodoro',
  '/api/v1/pomodoro/start',
  '/api/v1/pomodoro/complete',
  '/api/v1/pomodoro/cancel',
  '/api/v1/pomodoro/settings',
  '/api/v1/history',
  '/api/v1/history/{date}',
  '/api/v1/calendar/overrides',
  '/api/v1/calendar/overrides/{date}',
  '/api/v1/workspace',
  '/api/v1/workspace/settings',
  '/api/v1/onboarding',
  '/api/v1/system/status',
]) {
  if (!contract.paths?.[path]) {
    throw new Error(`OpenAPI contract is missing ${path}`)
  }
}

const workspaceRequired = contract.components?.schemas?.WorkspaceResponse?.required
for (const property of [
  'id',
  'timezone',
  'themeId',
  'backgroundMode',
  'onboardingCompleted',
  'version',
]) {
  if (!workspaceRequired?.includes(property)) {
    throw new Error(`WorkspaceResponse must require ${property}`)
  }
}

console.log('OpenAPI contract structure and version are valid.')
