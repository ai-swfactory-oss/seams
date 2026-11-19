const VERSION_BYTE = 6
const VARIANT_BYTE = 8
const GROUPS = [4, 2, 2, 2, 6] as const

const toHex = (byte: number): string => byte.toString(16).padStart(2, '0')

const withVersionAndVariant = (bytes: Uint8Array): Uint8Array => {
  const out = Uint8Array.from({ length: 16 }, (_, index) => bytes[index] ?? 0)
  out[VERSION_BYTE] = ((out[VERSION_BYTE] ?? 0) & 0x0f) | 0x40
  out[VARIANT_BYTE] = ((out[VARIANT_BYTE] ?? 0) & 0x3f) | 0x80
  return out
}

export const formatUuidV4 = (bytes: Uint8Array): string => {
  const hex = Array.from(withVersionAndVariant(bytes), toHex)
  const groups: string[] = []
  let offset = 0
  for (const size of GROUPS) {
    groups.push(hex.slice(offset, offset + size).join(''))
    offset += size
  }
  return groups.join('-')
}
