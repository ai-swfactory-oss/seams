import type { Change, ChangeFailure, Selection, Tree, TreeEntry } from '../types'
import { comparePaths, isWithin, normalisePath, parentsOf } from './path'
import { selectionMatcher } from './selection'

export type Volume = ReadonlyMap<string, TreeEntry>

const withParents = (volume: Map<string, TreeEntry>, path: string): void => {
  for (const parent of parentsOf(path)) {
    if (!volume.has(parent)) volume.set(parent, { path: parent, kind: 'directory' })
  }
}

export const volumeOf = (tree: Tree): Volume => {
  const volume = new Map<string, TreeEntry>()
  for (const entry of tree.entries) {
    withParents(volume, entry.path)
    volume.set(entry.path, entry)
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

const treeOf = (volume: Volume, keep: (path: string) => boolean): Tree => listedTree(volume.values(), keep)

export const treeOfVolume = (volume: Volume): Tree => treeOf(volume, () => true)

export const snapshotOf = (volume: Volume, selection: Selection): Tree => {
  const selects = selectionMatcher(selection)
  return selects === undefined ? { entries: [] } : treeOf(volume, selects)
}

type Step = { readonly volume: Volume; readonly failure?: undefined } | { readonly failure: ChangeFailure }

const parentFailure = (volume: Volume, path: string): ChangeFailure | undefined =>
  parentsOf(path).some(parent => {
    const entry = volume.get(parent)
    return entry !== undefined && entry.kind !== 'directory'
  })
    ? 'not-a-directory'
    : undefined

const place = (volume: Volume, entry: TreeEntry): Step => {
  const failure = parentFailure(volume, entry.path)
  if (failure !== undefined) return { failure }
  const next = new Map(volume)
  withParents(next, entry.path)
  next.set(entry.path, entry)
  return { volume: next }
}

const without = (volume: Volume, path: string): Map<string, TreeEntry> => new Map([...volume].filter(([key]) => !isWithin(key, path)))

export const stepOf = (volume: Volume, change: Change): Step => {
  if (change.kind === 'move') {
    const from = normalisePath(change.from)
    const to = normalisePath(change.to)
    if (from === undefined || to === undefined || from === '' || to === '' || isWithin(to, from)) {
      return { failure: 'invalid-path' }
    }
    if (!volume.has(from)) return { failure: 'not-found' }
    if (volume.has(to)) return { failure: 'exists' }
    const failure = parentFailure(volume, to)
    if (failure !== undefined) return { failure }
    const next = without(volume, from)
    withParents(next, to)
    for (const [path, entry] of volume) {
      if (isWithin(path, from)) {
        const moved = `${to}${path.slice(from.length)}`
        next.set(moved, { ...entry, path: moved })
      }
    }
    return { volume: next }
  }
  const path = normalisePath(change.path)
  if (path === undefined || path === '') return { failure: 'invalid-path' }
  const existing = volume.get(path)
  switch (change.kind) {
    case 'write':
      if (existing?.kind === 'directory') return { failure: 'is-a-directory' }
      return place(volume, { path, kind: 'file', content: change.content, executable: change.executable })
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
