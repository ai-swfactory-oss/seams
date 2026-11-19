import type { NonEmptyDirectory } from '../types'
import { comparePaths, parentsOf } from './path'

interface Listed {
  readonly path: string
  readonly kind: string
}

export const nonEmptyDirectoryOf = (entries: Iterable<Listed>): NonEmptyDirectory | undefined => {
  const all = [...entries]
  const holders = new Set(all.flatMap(entry => parentsOf(entry.path)))
  const [path] = all
    .filter(entry => entry.kind === 'directory' && holders.has(entry.path))
    .map(entry => entry.path)
    .sort(comparePaths)
  return path === undefined ? undefined : { kind: 'non-empty-directory', path }
}
