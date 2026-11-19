import type { TreeJson } from '../src/index'
import { createMemoryFiles, type MemoryFiles } from '../src/memory/index'

export const memoryFilesOver = (initial: TreeJson): MemoryFiles => {
  const created = createMemoryFiles(initial)
  if (created.kind === 'non-empty-directory') throw new Error(`the initial tree holds the non-empty directory ${created.path}`)
  return created.files
}
