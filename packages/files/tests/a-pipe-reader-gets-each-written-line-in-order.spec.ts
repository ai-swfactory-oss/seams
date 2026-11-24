import { describe, expect, it } from 'vitest'

import { memoryFilesOver } from './memory-files'

describe('a pipe reader', () => {
  it('lines written while a reader holds the pipe reach it one by one in order without newlines', async () => {
    const files = memoryFilesOver({ entries: [{ path: 'events', kind: 'pipe' }] })
    const reading = new AbortController()
    const lines = files.readLines('events', { signal: reading.signal })[Symbol.asyncIterator]()

    const outcomes = [await files.writeLine('events', 'first'), await files.writeLine('events', 'second')]
    const received = [await lines.next(), await lines.next()]
    reading.abort()

    expect(outcomes).toEqual([{ kind: 'written' }, { kind: 'written' }])
    expect(received).toEqual([
      { done: false, value: 'first' },
      { done: false, value: 'second' },
    ])
    expect(await lines.next()).toEqual({ done: true, value: undefined })
  })
})
