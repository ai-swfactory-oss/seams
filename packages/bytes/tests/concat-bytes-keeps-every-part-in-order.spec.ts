import { describe, expect, it } from 'vitest'

import { concatBytes } from '../src/index'

describe('concatBytes', () => {
  it('puts every part one after another, empty parts included', () => {
    expect(concatBytes([Uint8Array.of(1, 2), new Uint8Array(), Uint8Array.of(3), Uint8Array.of(4, 5, 6)])).toEqual(
      Uint8Array.of(1, 2, 3, 4, 5, 6),
    )
  })

  it('gives an empty array for no parts, and a copy that does not share a single part', () => {
    const part = Uint8Array.of(7, 8)
    const joined = concatBytes([part])
    part[0] = 0

    expect([concatBytes([]), joined]).toEqual([new Uint8Array(), Uint8Array.of(7, 8)])
  })
})
