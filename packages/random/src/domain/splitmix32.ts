const GOLDEN_GAMMA = 0x9e3779b9
const MAX_SEED = 0xffffffff
const WORD_BYTES = 4

export interface Draw {
  readonly bytes: Uint8Array
  readonly seed: number
}

export const assertSeed = (seed: number): void => {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED)
    throw new RangeError(`A memory random seed is an integer from 0 to ${String(MAX_SEED)}; got ${String(seed)}.`)
}

export const assertLength = (n: number): void => {
  if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`A random byte count is a non-negative safe integer; got ${String(n)}.`)
}

const mix = (state: number): number => {
  const first = Math.imul(state ^ (state >>> 16), 0x21f0aaad)
  const second = Math.imul(first ^ (first >>> 15), 0x735a2d97)
  return (second ^ (second >>> 15)) >>> 0
}

export const drawBytes = (seed: number, n: number): Draw => {
  const bytes = new Uint8Array(n)
  let state = seed
  for (let offset = 0; offset < n; offset += WORD_BYTES) {
    state = (state + GOLDEN_GAMMA) >>> 0
    const word = mix(state)
    for (let index = 0; index < WORD_BYTES && offset + index < n; index += 1) bytes[offset + index] = (word >>> (8 * index)) & 0xff
  }
  return { bytes, seed: state }
}
