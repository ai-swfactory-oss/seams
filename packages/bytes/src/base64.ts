const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export class InvalidBase64Error extends Error {
  constructor(readonly text: string) {
    super(`not standard padded base64 (${String(text.length)} characters)`)
    this.name = 'InvalidBase64Error'
  }
}

export const encodeBase64 = (bytes: Uint8Array): string => {
  let out = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index] ?? 0
    const b = bytes[index + 1] ?? 0
    const c = bytes[index + 2] ?? 0
    const remaining = bytes.length - index
    out += ALPHABET.charAt(a >> 2)
    out += ALPHABET.charAt(((a & 0x03) << 4) | (b >> 4))
    out += remaining > 1 ? ALPHABET.charAt(((b & 0x0f) << 2) | (c >> 6)) : '='
    out += remaining > 2 ? ALPHABET.charAt(c & 0x3f) : '='
  }
  return out
}

const sextetAt = (text: string, position: number): number => {
  const value = ALPHABET.indexOf(text.charAt(position))
  if (value === -1) throw new InvalidBase64Error(text)
  return value
}

const paddingOf = (text: string): number => {
  if (text.endsWith('==')) return 2
  if (text.endsWith('=')) return 1
  return 0
}

export const decodeBase64 = (text: string): Uint8Array => {
  if (text.length % 4 !== 0) throw new InvalidBase64Error(text)
  const padding = paddingOf(text)
  const out = new Uint8Array((text.length / 4) * 3 - padding)
  let written = 0
  for (let index = 0; index < text.length; index += 4) {
    const kept = index + 4 === text.length ? 4 - padding : 4
    let triple = 0
    for (let offset = 0; offset < 4; offset += 1) {
      triple = (triple << 6) | (offset < kept ? sextetAt(text, index + offset) : 0)
    }
    const count = kept - 1
    if (count < 3 && (triple & ((1 << ((3 - count) * 8)) - 1)) !== 0) throw new InvalidBase64Error(text)
    for (let byte = 0; byte < count; byte += 1) {
      out[written] = (triple >> (16 - byte * 8)) & 0xff
      written += 1
    }
  }
  return out
}
