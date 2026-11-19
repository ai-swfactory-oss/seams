import type { Random } from '@ai-swfactory-oss/random'

export type IdsData = Readonly<Record<never, never>>

export interface IdsPorts {
  readonly random: Random
}

export interface Ids {
  readonly uuid: () => string
}
