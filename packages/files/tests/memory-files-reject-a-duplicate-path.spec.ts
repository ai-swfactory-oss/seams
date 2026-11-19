import { describe, expect, it } from 'vitest'

import { createMemoryFiles } from '../src/memory/index'

describe('createMemoryFiles rejects a duplicate path', () => {
  it('returns a failure naming a path its initial tree gives by two entries', () => {
    expect(
      createMemoryFiles({
        entries: [
          { path: 'a', kind: 'file', content: 'YQ==', executable: false },
          { path: 'a', kind: 'symlink', target: 'b' },
        ],
      }),
    ).toEqual({ kind: 'duplicate-path', path: 'a' })
  })
})
