import { describe, expect, it } from 'vitest'

import { entriesOf, memoryFilesOver } from './memory-files'

describe('the memory files snapshot', () => {
  it('holds no non-empty directory: after mkdir a and write a/b it lists a/b only', async () => {
    const files = memoryFilesOver({ entries: [] })

    await files.apply([
      { kind: 'mkdir', path: 'a' },
      { kind: 'write', path: 'a/b', content: new TextEncoder().encode('b'), executable: false },
    ])
    const entries = entriesOf(await files.snapshot({ root: '', include: [], exclude: [] }))

    expect(entries.map(entry => entry.path)).toEqual(['a/b'])
  })
})
