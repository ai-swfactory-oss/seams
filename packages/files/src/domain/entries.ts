import type { Tree, TreeEntry } from '../types'
import { comparePaths, parentsOf } from './path'
import { listedTree } from './volume'

export type TreeOfEntries = { readonly kind: 'tree'; readonly tree: Tree } | { readonly kind: 'not-a-directory'; readonly path: string }

export const treeOfEntries = (entries: Iterable<TreeEntry>): TreeOfEntries => {
  const byPath = new Map<string, TreeEntry>()
  for (const entry of entries) byPath.set(entry.path, entry)
  for (const path of Array.from(byPath.keys()).sort(comparePaths)) {
    const blocked = parentsOf(path).find(parent => {
      const holder = byPath.get(parent)
      return holder !== undefined && holder.kind !== 'directory'
    })
    if (blocked !== undefined) return { kind: 'not-a-directory', path: blocked }
  }
  return { kind: 'tree', tree: listedTree(byPath.values(), () => true) }
}
