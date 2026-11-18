import { describe, expect, it } from 'vitest'

import { decodeBase64, encodeBase64, InvalidBase64Error } from '../src/index'

const EVERY_BYTE = Uint8Array.from({ length: 256 }, (_, index) => index)

describe('the base64 codec', () => {
  it('round-trips every byte value, at every length that pads differently', () => {
    const inputs = [EVERY_BYTE, EVERY_BYTE.subarray(1), EVERY_BYTE.subarray(2), new Uint8Array()]

    expect(inputs.map(bytes => decodeBase64(encodeBase64(bytes)))).toEqual(inputs)
  })

  it('encodes the standard alphabet with padding', () => {
    const text = (value: string): Uint8Array => new TextEncoder().encode(value)

    expect([text(''), text('f'), text('fo'), text('foo'), text('foob'), Uint8Array.of(0xfb, 0xff)].map(encodeBase64)).toEqual([
      '',
      'Zg==',
      'Zm8=',
      'Zm9v',
      'Zm9vYg==',
      '+/8=',
    ])
  })

  it.each([
    ['a length that is not a multiple of four', 'Zm9'],
    ['a character outside the alphabet', 'Zm9-'],
    ['the url-safe alphabet', '-_8='],
    ['padding before the end', 'Zg==Zm8='],
    ['three padding characters', 'Z==='],
    ['whitespace', 'Zm9v\n'],
    ['bits a canonical encoding leaves zero', 'Zh=='],
  ])('rejects %s with the named error', (_case, text) => {
    expect(() => decodeBase64(text)).toThrow(InvalidBase64Error)
  })
})
