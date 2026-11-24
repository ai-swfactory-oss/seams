import { describe, expect, it } from 'vitest'

import { contentIntegrity, treeDigest } from '../src/index'
import { memoryFilesOver } from './memory-files'

describe('a snapshot with a named pipe', () => {
  it('a snapshot lists a named pipe as a pipe entry with the digest line path NUL pipe NUL p', async () => {
    const files = memoryFilesOver({ entries: [{ path: 'run/events', kind: 'pipe' }] })

    const tree = await files.snapshot({ root: '', include: [], exclude: [] })

    expect(tree.entries).toEqual([{ path: 'run/events', kind: 'pipe' }])
    expect(await treeDigest(tree)).toBe(await contentIntegrity(new TextEncoder().encode('run/events\0pipe\0p\n')))
  })
})
