import { describe, expect, it } from 'vitest'

import { generateRandomState } from '../src/generate/index'
import { createMemoryRandom } from '../src/memory/index'

describe('the random generator', () => {
  it('records a memory state seeded from the bytes the port gives, at the given position', () => {
    const random = createMemoryRandom({ seed: 7, drawn: 0 })
    const [a = 0, b = 0, c = 0, d = 0] = createMemoryRandom({ seed: 7, drawn: 0 }).bytes(4)

    const state = generateRandomState({ drawn: 3 }, { random })

    expect([state, random.state()]).toEqual([
      { seed: ((a * 256 + b) * 256 + c) * 256 + d, drawn: 3 },
      { seed: 7, drawn: 4 },
    ])
  })

  it('gives a state a memory adapter resumes from', () => {
    const state = generateRandomState({ drawn: 0 }, { random: createMemoryRandom({ seed: 11, drawn: 0 }) })

    expect(state === undefined ? [] : [...createMemoryRandom(state).bytes(8)]).toHaveLength(8)
  })

  it('refuses as data a position that is not a whole number of bytes, zero or more', () => {
    const random = createMemoryRandom({ seed: 7, drawn: 0 })

    expect([-1, 0.5, Number.NaN].map(drawn => generateRandomState({ drawn }, { random }))).toEqual([undefined, undefined, undefined])
  })
})
