import { describe, expect, it } from 'vitest'

import { deflateRaw, gunzip, gzip, inflateRaw } from '../src/index'

const SAMPLES: readonly Uint8Array[] = [
  new Uint8Array(),
  new TextEncoder().encode('hello, archive\n'.repeat(50)),
  Uint8Array.from({ length: 70000 }, (_, index) => (index * 7919 + (index >> 3)) & 0xff),
]

describe('gzip and raw deflate round trip', () => {
  it('gzip then gunzip gives back the same bytes', async () => {
    const back = await Promise.all(SAMPLES.map(async sample => gunzip(await gzip(sample))))

    expect(back).toStrictEqual(SAMPLES.map(bytes => ({ kind: 'bytes', bytes })))
  })

  it('raw deflate then inflate gives back the same bytes', async () => {
    const back = await Promise.all(SAMPLES.map(async sample => inflateRaw(await deflateRaw(sample))))

    expect(back).toStrictEqual(SAMPLES.map(bytes => ({ kind: 'bytes', bytes })))
  })
})
