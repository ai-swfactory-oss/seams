import type { DuplicatePath } from '../types'
import { comparePaths } from './path'

interface Listed {
  readonly path: string
}

export const duplicatePathOf = (entries: Iterable<Listed>): DuplicatePath | undefined => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const { path } of entries) {
    if (seen.has(path)) duplicates.add(path)
    seen.add(path)
  }
  const [path] = [...duplicates].sort(comparePaths)
  return path === undefined ? undefined : { kind: 'duplicate-path', path }
}
