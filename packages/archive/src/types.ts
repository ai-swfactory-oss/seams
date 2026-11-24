import type { Change, Tree } from '@ai-swfactory-oss/files'

export type TarFailure =
  | 'truncated'
  | 'bad-checksum'
  | 'not-ustar'
  | 'bad-number'
  | 'bad-pax-record'
  | 'invalid-path'
  | 'unsupported-entry-type'
  | 'not-a-directory'

export interface MalformedTar {
  readonly kind: 'malformed'
  readonly reason: TarFailure
  readonly offset: number
}

export type GzipFailure = 'not-gzip' | 'bad-header' | 'truncated' | 'bad-deflate' | 'bad-crc' | 'bad-size'

export interface MalformedGzip {
  readonly kind: 'malformed'
  readonly reason: GzipFailure
}

export interface TooLarge {
  readonly kind: 'too-large'
  readonly limit: number
}

export interface TooManyEntries {
  readonly kind: 'too-many-entries'
  readonly limit: number
}

export type Unpacked = { readonly kind: 'tree'; readonly tree: Tree } | MalformedTar

export type Extracted = { readonly kind: 'changes'; readonly changes: readonly Change[] } | MalformedTar

export type Inflated = { readonly kind: 'bytes'; readonly bytes: Uint8Array } | MalformedGzip | TooLarge

export interface ListedEntry {
  readonly path: string
  readonly kind: 'file' | 'symlink' | 'directory' | 'pipe'
  readonly size: number
}

export interface ListingLimits {
  readonly maxBytes: number
  readonly maxEntries: number
}

export type Listing =
  | { readonly kind: 'entries'; readonly entries: readonly ListedEntry[] }
  | MalformedTar
  | MalformedGzip
  | TooLarge
  | TooManyEntries
