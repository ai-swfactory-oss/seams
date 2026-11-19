import { assertLength, assertSeed, drawBytes } from '../domain/splitmix32'
import type { MemoryRandom, MemoryRandomState } from '../index'

export const createMemoryRandom = (initial: MemoryRandomState): MemoryRandom => {
  assertSeed(initial.seed)
  let seed = initial.seed
  return {
    bytes: n => {
      assertLength(n)
      const draw = drawBytes(seed, n)
      seed = draw.seed
      return draw.bytes
    },
    state: () => ({ seed }),
  }
}
