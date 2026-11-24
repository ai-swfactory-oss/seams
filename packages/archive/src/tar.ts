import { concatBytes } from '@ai-swfactory-oss/bytes'
import { normalisePath, type Tree, type TreeEntry, treeOfEntries } from '@ai-swfactory-oss/files'

import type { ListedEntry, MalformedTar, TarFailure, TooManyEntries, Unpacked } from './types'

const BLOCK = 512
const NAME = 100
const PREFIX = 155

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

const MODES: Readonly<Record<TreeEntry['kind'], number>> = { file: 0o644, symlink: 0o777, directory: 0o755, pipe: 0o644 }
const TYPES: Readonly<Record<TreeEntry['kind'], string>> = { file: '0', symlink: '2', directory: '5', pipe: '6' }

const modeOf = (entry: TreeEntry): number => (entry.kind === 'file' && entry.executable ? 0o755 : MODES[entry.kind])

const octal = (value: number, width: number): string => `${value.toString(8).padStart(width - 1, '0')}\0`

const put = (block: Uint8Array, at: number, width: number, text: string | Uint8Array): void => {
  block.set((typeof text === 'string' ? encoder.encode(text) : text).subarray(0, width), at)
}

interface HeaderFields {
  readonly name: Uint8Array
  readonly prefix: Uint8Array
  readonly mode: number
  readonly size: number
  readonly type: string
  readonly linkname: Uint8Array
}

const headerOf = (fields: HeaderFields): Uint8Array => {
  const block = new Uint8Array(BLOCK)
  put(block, 0, NAME, fields.name)
  put(block, 100, 8, octal(fields.mode, 8))
  put(block, 108, 8, octal(0, 8))
  put(block, 116, 8, octal(0, 8))
  put(block, 124, 12, octal(fields.size, 12))
  put(block, 136, 12, octal(0, 12))
  put(block, 148, 8, '        ')
  put(block, 156, 1, fields.type)
  put(block, 157, NAME, fields.linkname)
  put(block, 257, 6, 'ustar\0')
  put(block, 263, 2, '00')
  put(block, 345, PREFIX, fields.prefix)
  const sum = block.reduce((total, byte) => total + byte, 0)
  put(block, 148, 8, `${sum.toString(8).padStart(6, '0')}\0 `)
  return block
}

const padded = (data: Uint8Array): Uint8Array[] => {
  const rest = data.length % BLOCK
  return rest === 0 ? [data] : [data, new Uint8Array(BLOCK - rest)]
}

const paxRecord = (key: string, value: string): string => {
  const body = ` ${key}=${value}\n`
  const bodyLength = encoder.encode(body).length
  let length = bodyLength + 1
  while (String(length).length + bodyLength !== length) length = String(length).length + bodyLength
  return String(length) + body
}

interface NameSplit {
  readonly name: Uint8Array
  readonly prefix: Uint8Array
}

const splitName = (path: Uint8Array): NameSplit | undefined => {
  if (path.length <= NAME) return { name: path, prefix: new Uint8Array() }
  for (let at = Math.min(path.length - 1, PREFIX); at > 0; at -= 1) {
    if (path[at] === 0x2f && path.length - at - 1 <= NAME && path.length - at - 1 > 0) {
      return { name: path.subarray(at + 1), prefix: path.subarray(0, at) }
    }
  }
  return undefined
}

const blocksOf = (entry: TreeEntry): Uint8Array[] => {
  const path = encoder.encode(entry.kind === 'directory' ? `${entry.path}/` : entry.path)
  const target = encoder.encode(entry.kind === 'symlink' ? entry.target : '')
  const split = splitName(path)
  const records = [
    ...(split === undefined ? [paxRecord('path', entry.kind === 'directory' ? `${entry.path}/` : entry.path)] : []),
    ...(target.length > NAME && entry.kind === 'symlink' ? [paxRecord('linkpath', entry.target)] : []),
  ]
  const pax =
    records.length === 0
      ? []
      : (() => {
          const data = encoder.encode(records.join(''))
          const name = encoder.encode('PaxHeader')
          return [
            headerOf({ name, prefix: new Uint8Array(), mode: 0o644, size: data.length, type: 'x', linkname: new Uint8Array() }),
            ...padded(data),
          ]
        })()
  const content = entry.kind === 'file' ? entry.content : new Uint8Array()
  const header = headerOf({
    name: split?.name ?? path.subarray(0, NAME),
    prefix: split?.prefix ?? new Uint8Array(),
    mode: modeOf(entry),
    size: content.length,
    type: TYPES[entry.kind],
    linkname: target.subarray(0, NAME),
  })
  return [...pax, header, ...padded(content)]
}

export const packTar = (tree: Tree): Uint8Array => concatBytes([...tree.entries.flatMap(blocksOf), new Uint8Array(BLOCK * 2)])

interface RawEntry {
  readonly path: string
  readonly kind: ListedEntry['kind']
  readonly executable: boolean
  readonly target: string
  readonly content: Uint8Array
}

type Read = { readonly kind: 'entries'; readonly entries: readonly RawEntry[] } | MalformedTar | TooManyEntries

const failure = (reason: TarFailure, offset: number): MalformedTar => ({ kind: 'malformed', reason, offset })

const text = (bytes: Uint8Array): string | undefined => {
  const end = bytes.indexOf(0)
  try {
    return decoder.decode(end === -1 ? bytes : bytes.subarray(0, end))
  } catch {
    return undefined
  }
}

const numberAt = (block: Uint8Array, at: number, width: number): number | undefined => {
  const field = new TextDecoder()
    .decode(block.subarray(at, at + width))
    .replace(/[\0 ]+$/u, '')
    .replace(/^ +/u, '')
  if (field === '') return 0
  return /^[0-7]+$/u.test(field) ? Number.parseInt(field, 8) : undefined
}

const checksumOf = (block: Uint8Array): number =>
  block.reduce((total, byte, index) => total + (index >= 148 && index < 156 ? 0x20 : byte), 0)

const isZero = (block: Uint8Array): boolean => block.every(byte => byte === 0)

const KINDS: Readonly<Record<string, ListedEntry['kind']>> = {
  '0': 'file',
  '\0': 'file',
  '7': 'file',
  '2': 'symlink',
  '5': 'directory',
  '6': 'pipe',
}

const paxOf = (data: Uint8Array): ReadonlyMap<string, string> | undefined => {
  const records = new Map<string, string>()
  let at = 0
  while (at < data.length) {
    const space = data.indexOf(0x20, at)
    if (space === -1) return undefined
    const length = Number.parseInt(new TextDecoder().decode(data.subarray(at, space)), 10)
    if (!Number.isInteger(length) || length <= space - at || at + length > data.length || data[at + length - 1] !== 0x0a) return undefined
    const record = text(data.subarray(space + 1, at + length - 1))
    const equals = record?.indexOf('=') ?? -1
    if (record === undefined || equals <= 0) return undefined
    records.set(record.slice(0, equals), record.slice(equals + 1))
    at += length
  }
  return records
}

interface Pending {
  readonly path?: string
  readonly target?: string
}

export const readTar = (bytes: Uint8Array, maxEntries: number = Number.POSITIVE_INFINITY): Read => {
  const entries: RawEntry[] = []
  let pending: Pending = {}
  let offset = 0
  for (;;) {
    if (offset + BLOCK > bytes.length) return failure('truncated', offset)
    const block = bytes.subarray(offset, offset + BLOCK)
    if (isZero(block)) return Object.keys(pending).length === 0 ? { kind: 'entries', entries } : failure('truncated', offset)
    if (numberAt(block, 148, 8) !== checksumOf(block)) return failure('bad-checksum', offset)
    if (text(block.subarray(257, 262)) !== 'ustar') return failure('not-ustar', offset)
    const size = numberAt(block, 124, 12)
    const mode = numberAt(block, 100, 8)
    if (size === undefined || mode === undefined) return failure('bad-number', offset)
    const dataStart = offset + BLOCK
    const next = dataStart + Math.ceil(size / BLOCK) * BLOCK
    if (next > bytes.length) return failure('truncated', offset)
    const data = bytes.subarray(dataStart, dataStart + size)
    const type = String.fromCharCode(block[156] ?? 0)
    if (type === 'x') {
      const records = paxOf(data)
      if (records === undefined) return failure('bad-pax-record', offset)
      const path = records.get('path')
      const target = records.get('linkpath')
      pending = { ...pending, ...(path === undefined ? {} : { path }), ...(target === undefined ? {} : { target }) }
    } else if (type === 'L' || type === 'K') {
      const value = text(data)
      if (value === undefined) return failure('invalid-path', offset)
      pending = type === 'L' ? { ...pending, path: value } : { ...pending, target: value }
    } else if (type !== 'g') {
      const kind = KINDS[type]
      if (kind === undefined) return failure('unsupported-entry-type', offset)
      const name = text(block.subarray(0, NAME))
      const prefix = text(block.subarray(345, 345 + PREFIX))
      const raw = pending.path ?? (name === undefined || prefix === undefined ? undefined : prefix === '' ? name : `${prefix}/${name}`)
      const target = pending.target ?? text(block.subarray(157, 157 + NAME))
      const path = raw === undefined ? undefined : normalisePath(raw)
      if (path === undefined || target === undefined || (path === '' && kind !== 'directory')) return failure('invalid-path', offset)
      if (path !== '') {
        if (entries.length >= maxEntries) return { kind: 'too-many-entries', limit: maxEntries }
        entries.push({ path, kind, executable: (mode & 0o100) !== 0, target: kind === 'symlink' ? target : '', content: data })
      }
      pending = {}
    }
    offset = next
  }
}

const treeEntryOf = ({ path, kind, executable, target, content }: RawEntry): TreeEntry => {
  switch (kind) {
    case 'file':
      return { path, kind, content, executable }
    case 'symlink':
      return { path, kind, target }
    case 'directory':
    case 'pipe':
      return { path, kind }
  }
}

export const unpackTar = (bytes: Uint8Array): Unpacked => {
  const read = readTar(bytes)
  if (read.kind === 'malformed') return read
  if (read.kind !== 'entries') return failure('truncated', 0)
  const holders = new Set(
    read.entries.flatMap(entry => {
      const parts = entry.path.split('/').slice(0, -1)
      return parts.map((_, index) => parts.slice(0, index + 1).join('/'))
    }),
  )
  const latest = new Map(read.entries.map(entry => [entry.path, entry]))
  const entries = [...latest.values()].filter(entry => entry.kind !== 'directory' || !holders.has(entry.path)).map(treeEntryOf)
  const checked = treeOfEntries(entries)
  return checked.kind === 'tree' ? checked : failure('not-a-directory', 0)
}

export const listedOf = (entries: readonly RawEntry[]): ListedEntry[] =>
  entries.map(({ path, kind, content }) => ({ path, kind, size: content.length }))
