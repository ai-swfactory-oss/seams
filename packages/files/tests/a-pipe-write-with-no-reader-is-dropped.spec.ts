import { describe, expect, it } from 'vitest'

import { memoryFilesOver } from './memory-files'

describe('a pipe write with no reader', () => {
  it('a write with no reader resolves no-reader at once and a later reader never sees the line', async () => {
    const files = memoryFilesOver({ entries: [{ path: 'events', kind: 'pipe' }] })

    const dropped = await files.writeLine('events', 'lost')
    const reading = new AbortController()
    const lines = files.readLines('events', { signal: reading.signal })[Symbol.asyncIterator]()
    await files.writeLine('events', 'kept')
    const received = await lines.next()
    reading.abort()

    expect(dropped).toEqual({ kind: 'no-reader' })
    expect(received).toEqual({ done: false, value: 'kept' })
  })
})
