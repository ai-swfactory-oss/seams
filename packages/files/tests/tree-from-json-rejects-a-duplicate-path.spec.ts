import { describe, expect, it } from 'vitest'

import { treeFromJson } from '../src/index'

describe('treeFromJson rejects a duplicate path', () => {
  it('returns a failure naming a path given by two entries', () => {
    expect(
      treeFromJson({
        entries: [
          { path: 'a', kind: 'file', content: 'YQ==', executable: false },
          { path: 'a', kind: 'file', content: 'Yg==', executable: false },
        ],
      }),
    ).toEqual({ kind: 'duplicate-path', path: 'a' })
  })
})
