import { type Change, escapeGlob, type Files, joinPath, normalisePath, treeDigest, type TreeEntry } from '@ai-swfactory-oss/files'

import type { ContentStore, ContentStoreData, ContentStorePorts, Got } from './types'

const MISSING: Got = { kind: 'missing' }

const changeOf = (at: string, entry: TreeEntry): Change => {
  const path = joinPath(at, entry.path)
  if (entry.kind === 'file') return { kind: 'write', path, content: entry.content, executable: entry.executable }
  if (entry.kind === 'symlink') return { kind: 'symlink', path, target: entry.target }
  return { kind: 'mkdir', path }
}

const read = async (files: Files, root: string, digest: string): Promise<Got> => {
  const at = joinPath(root, digest)
  const stored = await files.snapshot({ root, include: [`${escapeGlob(digest)}/**`], exclude: [] })
  if (stored.entries.length === 0) return MISSING
  const tree = {
    entries: stored.entries.flatMap(entry => (entry.path === at ? [] : [{ ...entry, path: entry.path.slice(at.length + 1) }])),
  }
  return (await treeDigest(tree)) === digest ? { kind: 'tree', tree } : MISSING
}

export const createContentStoreSdk = (data: ContentStoreData, { files }: ContentStorePorts): ContentStore => {
  const root = normalisePath(data.root) ?? data.root
  return {
    put: async tree => {
      const digest = await treeDigest(tree)
      if ((await read(files, root, digest)).kind === 'tree') return { kind: 'stored', digest }
      const at = joinPath(root, digest)
      const outcomes = await files.apply([{ kind: 'mkdir', path: at }, ...tree.entries.map(entry => changeOf(at, entry))])
      const [reason] = outcomes.flatMap(outcome => (outcome.kind === 'failed' ? [outcome.reason] : []))
      return reason === undefined ? { kind: 'stored', digest } : { kind: 'failed', reason }
    },
    get: digest => read(files, root, digest),
  }
}
