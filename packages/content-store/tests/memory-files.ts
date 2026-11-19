import type { TreeJson } from '@ai-swfactory-oss/files'
import { createMemoryFiles, type MemoryFiles } from '@ai-swfactory-oss/files/memory'

export const memoryFilesOver = (initial: TreeJson): MemoryFiles => {
  const created = createMemoryFiles(initial)
  if (created.kind === 'non-empty-directory') throw new Error(`the initial tree holds the non-empty directory ${created.path}`)
  return created.files
}
