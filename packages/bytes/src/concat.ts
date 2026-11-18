export const concatBytes = (parts: readonly Uint8Array[]): Uint8Array => {
  const joined = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  parts.reduce((offset, part) => {
    joined.set(part, offset)
    return offset + part.length
  }, 0)
  return joined
}
