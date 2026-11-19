import { describe, expect, it } from 'vitest'

import { treeOfEntries, treeToJson } from '../src/index'

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

describe('treeOfEntries', () => {
  it('sorts by path, lets a later entry win and lists a directory only while it is empty', () => {
    const result = treeOfEntries([
      { path: 'b', kind: 'file', content: bytes('first'), executable: false },
      { path: 'a', kind: 'directory' },
      { path: 'a/c', kind: 'symlink', target: '../b' },
      { path: 'empty', kind: 'directory' },
      { path: 'b', kind: 'file', content: bytes('second'), executable: true },
    ])

    expect(result.kind === 'tree' ? treeToJson(result.tree) : result).toEqual({
      entries: [
        { path: 'a/c', kind: 'symlink', target: '../b' },
        { path: 'b', kind: 'file', content: 'c2Vjb25k', executable: true },
        { path: 'empty', kind: 'directory' },
      ],
    })
  })

  it('names the first path that holds entries without being a directory', () => {
    expect(
      treeOfEntries([
        { path: 'x/y', kind: 'file', content: bytes('y'), executable: false },
        { path: 'x', kind: 'symlink', target: 'elsewhere' },
      ]),
    ).toEqual({ kind: 'not-a-directory', path: 'x' })
  })
})
