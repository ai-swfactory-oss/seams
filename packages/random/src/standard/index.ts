import { assertLength } from '../domain/splitmix32'
import type { RandomPort } from '../index'

const MAX_CHUNK = 65536

export const createStandardRandom = (): RandomPort => ({
  bytes: n => {
    assertLength(n)
    const bytes = new Uint8Array(n)
    for (let offset = 0; offset < n; offset += MAX_CHUNK) globalThis.crypto.getRandomValues(bytes.subarray(offset, offset + MAX_CHUNK))
    return bytes
  },
})
