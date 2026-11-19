const GOLDEN_GAMMA = 0x9e3779b9

const wordAt = (seed: number, index: number): number => {
  let z = (seed + Math.imul(index + 1, GOLDEN_GAMMA)) >>> 0
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad)
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97)
  return (z ^ (z >>> 15)) >>> 0
}

export const byteCount = (count: number): number => (Number.isInteger(count) && count > 0 ? count : 0)

export const streamBytes = (seed: number, from: number, count: number): Uint8Array => {
  const out = new Uint8Array(byteCount(count))
  const word = seed >>> 0
  for (let offset = 0; offset < out.length; offset += 1) {
    const position = from + offset
    const shift = (position % 4) * 8
    out[offset] = (wordAt(word, Math.floor(position / 4)) >>> shift) & 0xff
  }
  return out
}
