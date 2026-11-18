import { describe, expect, it } from 'vitest'

import { encodeHex } from '../src/index'

describe('encodeHex', () => {
  it('writes every byte as two lowercase hex digits, in order', () => {
    const every = Uint8Array.from({ length: 256 }, (_, index) => index)
    const digits = encodeHex(every)

    expect([digits.length, digits.slice(0, 8), digits.slice(30, 34), digits.slice(-4), /^[0-9a-f]*$/u.test(digits)]).toEqual([
      512,
      '00010203',
      '0f10',
      'feff',
      true,
    ])
  })

  it('gives the empty string for no bytes', () => {
    expect(encodeHex(new Uint8Array())).toBe('')
  })
})
