import { type Change, joinPath, normalisePath, type TreeEntry } from '@ai-swfactory-oss/files'

import { unpackTar } from './tar'
import type { Extracted } from './types'

const changeOf = (at: string, entry: TreeEntry): Change => {
  const path = joinPath(at, entry.path)
  switch (entry.kind) {
    case 'file':
      return { kind: 'write', path, content: entry.content, executable: entry.executable }
    case 'symlink':
      return { kind: 'symlink', path, target: entry.target }
    case 'pipe':
      return { kind: 'pipe', path }
    case 'directory':
      return { kind: 'mkdir', path }
  }
}

export const extractTar = (bytes: Uint8Array, at: string): Extracted => {
  const root = normalisePath(at)
  if (root === undefined) return { kind: 'malformed', reason: 'invalid-path', offset: 0 }
  const unpacked = unpackTar(bytes)
  if (unpacked.kind !== 'tree') return unpacked
  const entries = unpacked.tree.entries.map(entry => changeOf(root, entry))
  return { kind: 'changes', changes: root === '' ? entries : [{ kind: 'mkdir', path: root }, ...entries] }
}
