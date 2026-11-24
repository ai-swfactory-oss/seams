import { concatBytes } from '@ai-swfactory-oss/bytes'

import type { Inflated, TooLarge } from './types'

type Streamed = { readonly kind: 'bytes'; readonly bytes: Uint8Array } | { readonly kind: 'failed' } | TooLarge

const streamed = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream, limit: number): Promise<Streamed> => {
  const writer = stream.writable.getWriter()
  const written = writer
    .write(new Uint8Array(bytes))
    .then(() => writer.close())
    .then(
      () => undefined,
      () => undefined,
    )
  const reader = stream.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      const read: { readonly done: boolean; readonly value?: unknown } = await reader.read()
      if (read.done) break
      const { value } = read
      if (!(value instanceof Uint8Array)) throw new TypeError('the platform stream gave a chunk that is not bytes')
      total += value.byteLength
      if (total > limit) {
        await reader.cancel()
        await written
        return { kind: 'too-large', limit }
      }
      chunks.push(value)
    }
  } catch {
    await written
    return { kind: 'failed' }
  }
  await written
  return { kind: 'bytes', bytes: concatBytes(chunks) }
}

export const deflateRaw = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const result = await streamed(bytes, new CompressionStream('deflate-raw'), Number.POSITIVE_INFINITY)
  if (result.kind !== 'bytes') throw new Error('the platform deflate-raw CompressionStream failed on plain bytes')
  return result.bytes
}

export const inflateRaw = async (bytes: Uint8Array, limit: number = Number.POSITIVE_INFINITY): Promise<Inflated> => {
  const result = await streamed(bytes, new DecompressionStream('deflate-raw'), limit)
  return result.kind === 'failed' ? { kind: 'malformed', reason: 'bad-deflate' } : result
}
