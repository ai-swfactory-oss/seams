import { describe, expect, it } from 'vitest'

import { parseRandomState } from '../src/index'
import { createMemoryRandom } from '../src/memory/index'

const draw = (seed: number, count: number): number[] => Array.from(createMemoryRandom({ seed, drawn: 0 }).bytes(count))

describe('the memory random source', () => {
  it('gives the same bytes for the same seed', () => {
    expect(draw(7, 32)).toEqual(draw(7, 32))
  })

  it('gives different bytes for a different seed', () => {
    expect(draw(7, 32)).not.toEqual(draw(8, 32))
  })

  it('does not give a run of one repeated byte', () => {
    expect(new Set(draw(7, 32)).size).toBeGreaterThan(1)
  })

  it('continues the same stream across draws', () => {
    const random = createMemoryRandom({ seed: 7, drawn: 0 })

    const split = [...random.bytes(3), ...random.bytes(10), ...random.bytes(19)]

    expect(split).toEqual(draw(7, 32))
  })

  it('gives no bytes for a count that is not a whole number above zero', () => {
    const random = createMemoryRandom({ seed: 7, drawn: 0 })

    expect([random.bytes(0), random.bytes(-4), random.bytes(2.5), random.bytes(Number.NaN)].map(b => b.length)).toEqual([0, 0, 0, 0])
  })

  it('reports a state that survives a JSON round trip', () => {
    const random = createMemoryRandom({ seed: 7, drawn: 0 })
    random.bytes(5)

    expect(parseRandomState(JSON.parse(JSON.stringify(random.state())))).toEqual({ seed: 7, drawn: 5 })
  })

  it('continues the stream from a reported state', () => {
    const random = createMemoryRandom({ seed: 7, drawn: 0 })
    random.bytes(5)

    expect([...createMemoryRandom(random.state()).bytes(27)]).toEqual(draw(7, 32).slice(5))
  })

  it('reads no state from a value that does not hold one', () => {
    expect([null, [], { seed: 7 }, { seed: -1, drawn: 0 }, { seed: 7, drawn: 0.5 }].map(parseRandomState)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
})
