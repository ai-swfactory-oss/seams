import { byteCount } from '../domain/stream'
import type { Random } from '../index'

const MAX_BYTES_PER_DRAW = 65536

export const createStandardRandom = (): Random => ({
  bytes: count => {
    const out = new Uint8Array(byteCount(count))
    for (let offset = 0; offset < out.length; offset += MAX_BYTES_PER_DRAW)
      crypto.getRandomValues(out.subarray(offset, offset + MAX_BYTES_PER_DRAW))
    return out
  },
})
