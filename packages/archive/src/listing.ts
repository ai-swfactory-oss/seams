import { gunzip } from './gzip'
import { listedOf, readTar } from './tar'
import type { Listing, ListingLimits } from './types'

export const listTgz = async (bytes: Uint8Array, limits: ListingLimits): Promise<Listing> => {
  if (bytes.length > limits.maxBytes) return { kind: 'too-large', limit: limits.maxBytes }
  const tar = await gunzip(bytes, limits.maxBytes)
  if (tar.kind !== 'bytes') return tar
  const read = readTar(tar.bytes, limits.maxEntries)
  return read.kind === 'entries' ? { kind: 'entries', entries: listedOf(read.entries) } : read
}
