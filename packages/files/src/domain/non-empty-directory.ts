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

export class NonEmptyDirectoryError extends Error {
  constructor(
    readonly generator: string,
    readonly call: string,
    readonly path: string,
  ) {
    super(`${generator} refuses ${call}: its input holds the non-empty directory ${path}`)
    this.name = 'NonEmptyDirectoryError'
  }
}
