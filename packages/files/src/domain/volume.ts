import type { Change, FileEntry, KnownChangeFailure, Selection, Tree, TreeEntry } from '../types'
import { comparePaths, isWithin, normalisePath, parentsOf } from './path'
import { selectionMatcher } from './selection'

interface StoredFile {
  readonly path: string
  readonly kind: 'file'
  readonly content: Uint8Array
  readonly executable: boolean
  readonly node: symbol
}

type Stored = Exclude<TreeEntry, FileEntry> | StoredFile

export type Volume = ReadonlyMap<string, Stored>

const storedFile = (path: string, content: Uint8Array, executable: boolean): StoredFile => ({
  path,
  kind: 'file',
  content,
  executable,
  node: Symbol(path),
})

const storedOf = (entry: TreeEntry): Stored => (entry.kind === 'file' ? storedFile(entry.path, entry.content, entry.executable) : entry)

const withParents = (volume: Map<string, Stored>, path: string): void => {
  for (const parent of parentsOf(path)) {
    if (!volume.has(parent)) volume.set(parent, { path: parent, kind: 'directory' })
  }
}

export const volumeOf = (tree: Tree): Volume => {
  const volume = new Map<string, Stored>()
  for (const entry of tree.entries) {
    withParents(volume, entry.path)
    volume.set(entry.path, storedOf(entry))
  }
  return volume
}

export const listedTree = (entries: Iterable<TreeEntry>, keep: (path: string) => boolean): Tree => {
  const all = [...entries]
  const nonEmpty = new Set(all.flatMap(entry => parentsOf(entry.path)))
  return {
    entries: all
      .filter(entry => keep(entry.path) && (entry.kind !== 'directory' || !nonEmpty.has(entry.path)))
      .sort((a, b) => comparePaths(a.path, b.path)),
  }
}

const linkCounts = (volume: Volume): ReadonlyMap<symbol, number> => {
  const counts = new Map<symbol, number>()
  for (const entry of volume.values()) {
    if (entry.kind === 'file') counts.set(entry.node, (counts.get(entry.node) ?? 0) + 1)
  }
  return counts
}

const countedEntriesOf = (volume: Volume): TreeEntry[] => {
  const counts = linkCounts(volume)
  return [...volume.values()].map(entry =>
    entry.kind === 'file'
      ? { path: entry.path, kind: 'file', content: entry.content, executable: entry.executable, links: counts.get(entry.node) ?? 1 }
      : entry,
  )
}

export const treeOfVolume = (volume: Volume): Tree =>
  listedTree(
    [...volume.values()].map(entry =>
      entry.kind === 'file' ? { path: entry.path, kind: 'file', content: entry.content, executable: entry.executable } : entry,
    ),
    () => true,
  )

export const snapshotOf = (volume: Volume, selection: Selection): Tree => {
  const selects = selectionMatcher(selection)
  return selects === undefined ? { entries: [] } : listedTree(countedEntriesOf(volume), selects)
}

type Step = { readonly volume: Volume; readonly failure?: undefined } | { readonly failure: KnownChangeFailure }

const parentFailure = (volume: Volume, path: string): KnownChangeFailure | undefined =>
  parentsOf(path).some(parent => {
    const entry = volume.get(parent)
    return entry !== undefined && entry.kind !== 'directory'
  })
    ? 'not-a-directory'
    : undefined

const place = (volume: Volume, entry: Stored): Step => {
  const failure = parentFailure(volume, entry.path)
  if (failure !== undefined) return { failure }
  const next = new Map(volume)
  withParents(next, entry.path)
  next.set(entry.path, entry)
  return { volume: next }
}

const without = (volume: Volume, path: string): Map<string, Stored> => new Map([...volume].filter(([key]) => !isWithin(key, path)))

const moved = (volume: Volume, from: string, to: string): Step => {
  if (!volume.has(from)) return { failure: 'not-found' }
  if (volume.has(to)) return { failure: 'exists' }
  const failure = parentFailure(volume, to)
  if (failure !== undefined) return { failure }
  const next = without(volume, from)
  withParents(next, to)
  for (const [path, entry] of volume) {
    if (isWithin(path, from)) {
      const at = `${to}${path.slice(from.length)}`
      next.set(at, { ...entry, path: at })
    }
  }
  return { volume: next }
}

const linked = (volume: Volume, from: string, to: string): Step => {
  const source = volume.get(from)
  if (source === undefined) return { failure: 'not-found' }
  if (source.kind === 'directory') return { failure: 'is-a-directory' }
  if (volume.has(to)) return { failure: 'exists' }
  return place(volume, { ...source, path: to })
}

export const stepOf = (volume: Volume, change: Change): Step => {
  if (change.kind === 'move' || change.kind === 'link') {
    const from = normalisePath(change.from)
    const to = normalisePath(change.to)
    if (from === undefined || to === undefined || from === '' || to === '') return { failure: 'invalid-path' }
    if (change.kind === 'link') return linked(volume, from, to)
    return isWithin(to, from) ? { failure: 'invalid-path' } : moved(volume, from, to)
  }
  const path = normalisePath(change.path)
  if (path === undefined || path === '') return { failure: 'invalid-path' }
  const existing = volume.get(path)
  switch (change.kind) {
    case 'write':
      if (existing?.kind === 'directory') return { failure: 'is-a-directory' }
      return place(volume, storedFile(path, change.content, change.executable))
    case 'symlink':
      if (existing !== undefined) return { failure: 'exists' }
      return place(volume, { path, kind: 'symlink', target: change.target })
    case 'mkdir':
      if (existing?.kind === 'directory') return { volume }
      if (existing !== undefined) return { failure: 'exists' }
      return place(volume, { path, kind: 'directory' })
    case 'pipe':
      if (existing !== undefined) return { failure: 'exists' }
      return place(volume, { path, kind: 'pipe' })
    case 'delete':
      if (existing === undefined) return { failure: 'not-found' }
      return { volume: without(volume, path) }
  }
}
