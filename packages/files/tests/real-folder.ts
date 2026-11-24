import { type ChangeOutcome, comparePaths, type KnownChangeFailure, type Tree, type TreeEntry } from '../src/index'

const text = (value: string): Uint8Array => new TextEncoder().encode(value)

export const file = (path: string, content: string, executable = false, links = 1): TreeEntry => ({
  path,
  kind: 'file',
  content: text(content),
  executable,
  links,
})

export const REAL_FOLDER: Tree = {
  entries: [
    file('bin/run', '#!/bin/sh\necho run\n', true),
    { path: 'empty', kind: 'directory' },
    { path: 'link', kind: 'symlink', target: 'src/a.ts' },
    { path: 'linked-dir', kind: 'symlink', target: 'src' },
    file('src/a.spec.ts', 'a spec\n'),
    file('src/a.ts', 'export const a = 1\n'),
    file('src/deep/b.ts', 'export const b = 2\n'),
  ],
}

export const APPLIED: ChangeOutcome = { kind: 'applied' }

export const SKIPPED: ChangeOutcome = { kind: 'skipped' }

interface Unperformable {
  readonly name: string
  readonly reason: KnownChangeFailure
}

export const UNPERFORMABLE_CHANGES: readonly Unperformable[] = [
  { name: 'an absolute path', reason: 'invalid-path' },
  { name: 'a path that leaves the root', reason: 'invalid-path' },
  { name: 'the root itself', reason: 'invalid-path' },
  { name: 'a delete of a missing path', reason: 'not-found' },
  { name: 'a symlink over an existing file', reason: 'exists' },
  { name: 'a mkdir over an existing file', reason: 'exists' },
  { name: 'a write over a directory', reason: 'is-a-directory' },
  { name: 'a write under a file', reason: 'not-a-directory' },
  { name: 'a write under a symlink to a directory', reason: 'not-a-directory' },
  { name: 'a move into itself', reason: 'invalid-path' },
  { name: 'a move of a missing path', reason: 'not-found' },
  { name: 'a move onto an existing path', reason: 'exists' },
  { name: 'a move under a file', reason: 'not-a-directory' },
]

export const failedCaseName = (name: string): string => `${name} fails, and the change after it is skipped`

export const PIPE_CHANGE_CASE = failedCaseName('a pipe change')

export const A_TS = 'export const a = 1\n'

export const LINK_CASE = 'a link change gives a file a second name'

export const LINKED_WRITE_CASE = 'a write to one name of a linked file leaves the other name unchanged'

export const LINKED_DELETE_CASE = 'a delete of one name of a linked file leaves the other name'

export const folderWithLinked = (entries: readonly TreeEntry[]): Tree => ({
  entries: [...REAL_FOLDER.entries.filter(entry => entry.path !== 'src/a.ts'), ...entries].sort((a, b) => comparePaths(a.path, b.path)),
})
