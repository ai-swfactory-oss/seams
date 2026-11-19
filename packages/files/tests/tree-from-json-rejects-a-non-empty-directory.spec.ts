import { describe, expect, it } from 'vitest'

import { treeFromJson } from '../src/index'

describe('treeFromJson rejects a non-empty directory', () => {
  it('returns a failure naming a directory entry that has an entry beneath it', () => {
    expect(
      treeFromJson({
        entries: [
          { path: 'a', kind: 'directory' },
          { path: 'a/c', kind: 'file', content: 'Yw==', executable: false },
        ],
      }),
    ).toEqual({ kind: 'non-empty-directory', path: 'a' })
  })
})
