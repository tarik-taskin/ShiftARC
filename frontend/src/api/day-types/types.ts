import { z } from 'zod'

const uuid = z.string().uuid()

export const dayTypeBlockSchema = z.object({
  id: uuid,
  name: z.string().min(1).max(80),
  startMinute: z.number().int().min(0).max(1435),
  endMinute: z.number().int().min(5).max(1440),
  categoryIds: z.array(uuid),
})

export const dayTypeSchema = z.object({
  id: uuid,
  name: z.string().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  archived: z.boolean(),
  version: z.number().int().nonnegative(),
  blocks: z.array(dayTypeBlockSchema).min(1),
})

export const dayTypeListSchema = z.array(dayTypeSchema)

export type DayType = z.infer<typeof dayTypeSchema>
export type DayTypeBlock = z.infer<typeof dayTypeBlockSchema>

export interface DayTypeInput {
  name: string
  color: string
}

export interface DayTypeUpdateInput extends DayTypeInput {
  id: string
  version: number
}

export interface DayTypeBlocksInput {
  id: string
  version: number
  blocks: Array<Pick<DayTypeBlock, 'name' | 'startMinute' | 'endMinute' | 'categoryIds'>>
}

export interface DayTypeVersionInput {
  id: string
  version: number
}

export class DayTypeClientError extends Error {
  readonly statusCode?: number

  constructor(message: string, statusCode?: number) {
    super(message)
    this.name = 'DayTypeClientError'
    this.statusCode = statusCode
  }
}
