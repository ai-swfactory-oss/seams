import type { TreeJson } from '@ai-swfactory-oss/files'
import { createMemoryFiles, type MemoryFiles } from '@ai-swfactory-oss/files/memory'
import { assert } from 'vitest'

export const memoryFilesOver = (initial: TreeJson): MemoryFiles => {
  const created = createMemoryFiles(initial)
  assert(created.kind === 'files', 'the initial tree is refused')
  return created.files
}
