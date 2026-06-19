import { z } from 'zod'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const categorySchema = z.object({
  id: z.string().regex(uuidPattern),
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().max(64).nullable(),
  archived: z.boolean(),
  version: z.number().int().nonnegative(),
})

export const categoryListSchema = z.array(categorySchema)

export type Category = z.infer<typeof categorySchema>

export interface CategoryInput {
  name: string
  color: string
  icon: string | null
}

export interface CategoryUpdateInput extends CategoryInput {
  id: string
  version: number
}

export interface CategoryVersionInput {
  id: string
  version: number
}

export class CategoryClientError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'CategoryClientError'
    this.statusCode = statusCode
  }
}
