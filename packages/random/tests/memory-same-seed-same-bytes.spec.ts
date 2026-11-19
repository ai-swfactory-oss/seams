import { describe, expect, it } from 'vitest'

import type { MemoryRandom } from '../src/index'
import { createMemoryRandom } from '../src/memory/index'

const LENGTHS = [0, 1, 3, 4, 5, 16, 33]

const drawAll = (random: MemoryRandom): Uint8Array[] => LENGTHS.map(n => random.bytes(n))

describe('the memory random adapter', () => {
  it('gives the same bytes for the same seed, call after call', () => {
    expect(drawAll(createMemoryRandom({ seed: 42 }))).toEqual(drawAll(createMemoryRandom({ seed: 42 })))
  })

  it('gives exactly n bytes per call', () => {
    expect(drawAll(createMemoryRandom({ seed: 7 })).map(bytes => bytes.length)).toEqual(LENGTHS)
  })

  it('gives different bytes for a different seed', () => {
    expect(createMemoryRandom({ seed: 1 }).bytes(32)).not.toEqual(createMemoryRandom({ seed: 2 }).bytes(32))
  })

  it('gives bytes that vary within one draw and between successive draws', () => {
    const random = createMemoryRandom({ seed: 0 })
    const first = random.bytes(64)
    const second = random.bytes(64)

    expect(new Set(first).size).toBeGreaterThan(32)
    expect(second).not.toEqual(first)
  })

  it('reports a JSON state of the type it was built from, which continues the same stream', () => {
    const original = createMemoryRandom({ seed: 99 })
    original.bytes(5)
    const reported: unknown = JSON.parse(JSON.stringify(original.state()))

    expect(reported).toStrictEqual(original.state())
    expect(reported).not.toStrictEqual({ seed: 99 })
    expect(createMemoryRandom(original.state()).bytes(12)).toEqual(original.bytes(12))
  })

  it.each([
    ['a negative seed', -1],
    ['a fractional seed', 1.5],
    ['a seed of 2^32', 2 ** 32],
    ['a NaN seed', Number.NaN],
  ])('rejects %s with a RangeError', (_case, seed) => {
    expect(() => createMemoryRandom({ seed })).toThrow(RangeError)
  })

  it.each([
    ['a negative length', -1],
    ['a fractional length', 2.5],
    ['an infinite length', Number.POSITIVE_INFINITY],
  ])('rejects %s with a RangeError', (_case, n) => {
    expect(() => createMemoryRandom({ seed: 3 }).bytes(n)).toThrow(RangeError)
  })
})
