import { concatBytes } from '@ai-swfactory-oss/bytes'

import { crc32 } from './crc32'
import { deflateRaw, inflateRaw } from './deflate'
import type { GzipFailure, Inflated } from './types'

const HEADER = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff])

const FHCRC = 0x02
const FEXTRA = 0x04
const FNAME = 0x08
const FCOMMENT = 0x10
const RESERVED = 0xe0

const TRAILER = 8

const littleEndian = (value: number): Uint8Array =>
  new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])

const readLittleEndian = (bytes: Uint8Array, at: number): number =>
  ((bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8) | ((bytes[at + 2] ?? 0) << 16) | ((bytes[at + 3] ?? 0) << 24)) >>> 0

const malformed = (reason: GzipFailure): Inflated => ({ kind: 'malformed', reason })

export const gzip = async (bytes: Uint8Array): Promise<Uint8Array> =>
  concatBytes([HEADER, await deflateRaw(bytes), littleEndian(crc32(bytes)), littleEndian(bytes.length >>> 0)])

const afterText = (bytes: Uint8Array, from: number): number => {
  const end = bytes.indexOf(0, from)
  return end === -1 ? bytes.length : end + 1
}

const bodyStart = (bytes: Uint8Array, flags: number): number => {
  let at = HEADER.length
  if ((flags & FEXTRA) !== 0) at += 2 + ((bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8))
  if ((flags & FNAME) !== 0) at = afterText(bytes, at)
  if ((flags & FCOMMENT) !== 0) at = afterText(bytes, at)
  if ((flags & FHCRC) !== 0) at += 2
  return at
}

export const gunzip = async (bytes: Uint8Array, limit: number = Number.POSITIVE_INFINITY): Promise<Inflated> => {
  if (bytes.length < HEADER.length + TRAILER) return malformed('truncated')
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return malformed('not-gzip')
  const flags = bytes[3] ?? 0
  if (bytes[2] !== 0x08 || (flags & RESERVED) !== 0) return malformed('bad-header')
  const start = bodyStart(bytes, flags)
  const end = bytes.length - TRAILER
  if (start > end) return malformed('truncated')
  const inflated = await inflateRaw(bytes.subarray(start, end), limit)
  if (inflated.kind !== 'bytes') return inflated
  if (crc32(inflated.bytes) !== readLittleEndian(bytes, end)) return malformed('bad-crc')
  if (inflated.bytes.length >>> 0 !== readLittleEndian(bytes, end + 4)) return malformed('bad-size')
  return inflated
}
