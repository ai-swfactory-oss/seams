import { assert } from 'vitest'

import type { TreeJson } from '../src/index'
import { createMemoryFiles, type MemoryFiles } from '../src/memory/index'

export const memoryFilesOver = (initial: TreeJson): MemoryFiles => {
  const created = createMemoryFiles(initial)
  assert(created.kind === 'files', 'the initial tree is refused')
  return created.files
}
