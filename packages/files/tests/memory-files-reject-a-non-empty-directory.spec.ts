import { describe, expect, it } from 'vitest'

import { createMemoryFiles } from '../src/memory/index'

describe('createMemoryFiles rejects a non-empty directory', () => {
  it('returns a failure naming a directory entry of its initial tree that has an entry beneath it', () => {
    expect(
      createMemoryFiles({
        entries: [
          { path: 'a', kind: 'directory' },
          { path: 'a/c', kind: 'symlink', target: '../b' },
        ],
      }),
    ).toEqual({ kind: 'non-empty-directory', path: 'a' })
  })
})
