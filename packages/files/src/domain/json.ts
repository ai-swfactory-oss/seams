import { decodeBase64, encodeBase64 } from '@ai-swfactory-oss/bytes'

import type { Change, ChangeJson, CheckedTree, Tree, TreeEntry, TreeEntryJson, TreeJson } from '../types'
import { nonEmptyDirectoryOf } from './non-empty-directory'
import { normalisePath } from './path'

export const treeToJson = (tree: Tree): TreeJson => ({
  entries: tree.entries.map(entry =>
    entry.kind === 'file' ? { path: entry.path, kind: 'file', content: encodeBase64(entry.content), executable: entry.executable } : entry,
  ),
})

export const treeFromJson = (json: TreeJson): CheckedTree =>
  nonEmptyDirectoryOf(json.entries) ?? {
    kind: 'tree',
    tree: {
      entries: json.entries.map(
        (entry): TreeEntry =>
          entry.kind === 'file'
            ? { path: entry.path, kind: 'file', content: decodeBase64(entry.content), executable: entry.executable }
            : entry,
      ),
    },
  }

export const changesToJson = (changes: readonly Change[]): ChangeJson[] =>
  changes.map(change => (change.kind === 'write' ? { ...change, content: encodeBase64(change.content) } : change))

export const changesFromJson = (json: readonly ChangeJson[]): Change[] =>
  json.map((change): Change => (change.kind === 'write' ? { ...change, content: decodeBase64(change.content) } : change))

const entryJsonOf = (value: unknown): TreeEntryJson | undefined => {
  if (typeof value !== 'object' || value === null || !('path' in value) || !('kind' in value)) return undefined
  const { path, kind } = value
  if (typeof path !== 'string' || normalisePath(path) !== path || path === '') return undefined
  if (kind === 'directory') return { path, kind }
  if (kind === 'symlink') {
    if (!('target' in value) || typeof value.target !== 'string') return undefined
    return { path, kind, target: value.target }
  }
  if (kind !== 'file' || !('content' in value) || !('executable' in value)) return undefined
  const { content, executable } = value
  if (typeof content !== 'string' || typeof executable !== 'boolean') return undefined
  return { path, kind, content, executable }
}

const changeJsonOf = (value: unknown): ChangeJson | undefined => {
  if (typeof value !== 'object' || value === null || !('kind' in value)) return undefined
  const text = (key: string): string | undefined => {
    const field: unknown = Object.getOwnPropertyDescriptor(value, key)?.value
    return typeof field === 'string' ? field : undefined
  }
  const path = text('path')
  switch (value.kind) {
    case 'move': {
      const from = text('from')
      const to = text('to')
      return from === undefined || to === undefined ? undefined : { kind: 'move', from, to }
    }
    case 'delete':
      return path === undefined ? undefined : { kind: 'delete', path }
    case 'mkdir':
      return path === undefined ? undefined : { kind: 'mkdir', path }
    case 'symlink': {
      const target = text('target')
      return path === undefined || target === undefined ? undefined : { kind: 'symlink', path, target }
    }
    case 'write': {
      const content = text('content')
      const executable: unknown = 'executable' in value ? value.executable : undefined
      return path === undefined || content === undefined || typeof executable !== 'boolean'
        ? undefined
        : { kind: 'write', path, content, executable }
    }
    default:
      return undefined
  }
}

export const parseChangesJson = (value: unknown): ChangeJson[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const changes: ChangeJson[] = []
  for (const raw of value) {
    const change = changeJsonOf(raw)
    if (change === undefined) return undefined
    changes.push(change)
  }
  return changes
}

export const parseTreeJson = (value: unknown): TreeJson | undefined => {
  if (typeof value !== 'object' || value === null || !('entries' in value) || !Array.isArray(value.entries)) return undefined
  const entries: TreeEntryJson[] = []
  for (const raw of value.entries) {
    const entry = entryJsonOf(raw)
    if (entry === undefined) return undefined
    entries.push(entry)
  }
  return { entries }
}
