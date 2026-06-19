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
