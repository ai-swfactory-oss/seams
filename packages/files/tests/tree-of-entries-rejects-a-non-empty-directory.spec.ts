import { describe, expect, it } from 'vitest'

import { treeOfEntries } from '../src/index'

describe('treeOfEntries rejects a non-empty directory', () => {
  it('returns a failure naming a directory entry that has an entry beneath it', () => {
    expect(
      treeOfEntries([
        { path: 'a', kind: 'directory' },
        { path: 'a/c', kind: 'symlink', target: '../b' },
      ]),
    ).toEqual({ kind: 'non-empty-directory', path: 'a' })
  })

  it('names the first such directory in path order', () => {
    expect(
      treeOfEntries([
        { path: 'z', kind: 'directory' },
        { path: 'z/y', kind: 'directory' },
        { path: 'b', kind: 'directory' },
        { path: 'b/deep/leaf', kind: 'symlink', target: 'x' },
      ]),
    ).toEqual({ kind: 'non-empty-directory', path: 'b' })
  })
})
