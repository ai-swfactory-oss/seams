import {
  type Change,
  comparePaths,
  escapeGlob,
  type Files,
  joinPath,
  normalisePath,
  type Tree,
  treeDigest,
  type TreeEntry,
  treeOfEntries,
} from '@ai-swfactory-oss/files'

import type { ContentStore, ContentStoreData, ContentStorePorts, Got, Refused, RootRefused } from './types'

const MISSING: Got = { kind: 'missing' }

const changeOf = (at: string, entry: TreeEntry): Change => {
  const path = joinPath(at, entry.path)
  if (entry.kind === 'file') return { kind: 'write', path, content: entry.content, executable: entry.executable }
  if (entry.kind === 'symlink') return { kind: 'symlink', path, target: entry.target }
  if (entry.kind === 'pipe') return { kind: 'pipe', path }
  return { kind: 'mkdir', path }
}

const refusalOf = (tree: Tree): Refused | undefined => {
  let previous: string | undefined
  for (const { path } of tree.entries) {
    if (path === '' || normalisePath(path) !== path) return { kind: 'refused', reason: 'path-not-normal', path }
    const order = previous === undefined ? -1 : comparePaths(previous, path)
    if (order === 0) return { kind: 'refused', reason: 'duplicate-path', path }
    if (order > 0) return { kind: 'refused', reason: 'out-of-order', path }
    previous = path
  }
  const checked = treeOfEntries(tree.entries)
  return checked.kind === 'tree' ? undefined : { kind: 'refused', reason: checked.kind, path: checked.path }
}

const held = async (files: Files, root: string, digest: string): Promise<readonly TreeEntry[]> =>
  (await files.snapshot({ root, include: [`${escapeGlob(digest)}/**`], exclude: [] })).entries

const treeAt = async (at: string, digest: string, entries: readonly TreeEntry[]): Promise<Got> => {
  if (entries.length === 0 || entries.some(entry => entry.path === at && entry.kind !== 'directory')) return MISSING
  const tree = {
    entries: entries.flatMap(entry => (entry.path === at ? [] : [{ ...entry, path: entry.path.slice(at.length + 1) }])),
  }
  return (await treeDigest(tree)) === digest ? { kind: 'tree', tree } : MISSING
}

export const createContentStoreSdk = (data: ContentStoreData, { files }: ContentStorePorts): ContentStore | RootRefused => {
  const root = normalisePath(data.root)
  if (root === undefined) return { kind: 'refused', reason: 'invalid-root', root: data.root }
  return {
    put: async tree => {
      const refused = refusalOf(tree)
      if (refused !== undefined) return refused
      const digest = await treeDigest(tree)
      const at = joinPath(root, digest)
      const existing = await held(files, root, digest)
      if ((await treeAt(at, digest, existing)).kind === 'tree') return { kind: 'stored', digest }
      const cleared: readonly Change[] = existing.length === 0 ? [] : [{ kind: 'delete', path: at }]
      const outcomes = await files.apply([...cleared, { kind: 'mkdir', path: at }, ...tree.entries.map(entry => changeOf(at, entry))])
      const [reason] = outcomes.flatMap(outcome => (outcome.kind === 'failed' ? [outcome.reason] : []))
      return reason === undefined ? { kind: 'stored', digest } : { kind: 'failed', reason }
    },
    get: async digest => treeAt(joinPath(root, digest), digest, await held(files, root, digest)),
  }
}
