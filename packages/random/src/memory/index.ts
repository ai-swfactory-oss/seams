import { byteCount, streamBytes } from '../domain/stream'
import type { Random, RandomState } from '../index'

export interface MemoryRandom extends Random {
  readonly state: () => RandomState
}

export const createMemoryRandom = (initial: RandomState): MemoryRandom => {
  const { seed } = initial
  let drawn = initial.drawn
  return {
    bytes: count => {
      const out = streamBytes(seed, drawn, count)
      drawn += byteCount(count)
      return out
    },
    state: () => ({ seed, drawn }),
  }
}
