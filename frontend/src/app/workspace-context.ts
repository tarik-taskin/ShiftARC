import { createContext, createElement, useContext, type ReactNode } from 'react'

import type { Workspace } from '@/api/workspace/types'

const WorkspaceContext = createContext<Workspace | null>(null)

export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: Workspace
  children: ReactNode
}) {
  return createElement(WorkspaceContext.Provider, { value: workspace }, children)
}

export function useCurrentWorkspace() {
  const workspace = useContext(WorkspaceContext)
  if (!workspace) {
    throw new Error('WorkspaceProvider is missing')
  }
  return workspace
}

export function useOptionalWorkspace() {
  return useContext(WorkspaceContext)
}
