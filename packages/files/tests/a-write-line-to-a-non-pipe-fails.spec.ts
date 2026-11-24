import { describe, expect, it } from 'vitest'

import { memoryFilesOver } from './memory-files'

describe('a write line to a non-pipe', () => {
  it('a write to a path that is not a named pipe fails with not-a-pipe', async () => {
    const files = memoryFilesOver({ entries: [{ path: 'notes.txt', kind: 'file', content: '', executable: false }] })

    const outcomes = [await files.writeLine('notes.txt', 'x'), await files.writeLine('missing', 'x')]

    expect(outcomes).toEqual([
      { kind: 'failed', reason: 'not-a-pipe' },
      { kind: 'failed', reason: 'not-a-pipe' },
    ])
  })
})
