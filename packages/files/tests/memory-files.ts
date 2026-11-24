import { assert } from 'vitest'

import type { Snapshot, TreeEntry, TreeJson } from '../src/index'
import { createMemoryFiles, type MemoryFiles } from '../src/memory/index'

export const memoryFilesOver = (initial: TreeJson): MemoryFiles => {
  const created = createMemoryFiles(initial)
  assert(created.kind === 'files', 'the initial tree is refused')
  return created.files
}

export const entriesOf = (snapshot: Snapshot): readonly TreeEntry[] => {
  assert(snapshot.kind === 'snapshot', 'the snapshot failed')
  return snapshot.tree.entries
}
