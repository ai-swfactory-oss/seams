import { describe, expect, it } from 'vitest'

import { memoryFilesOver } from './memory-files'

describe('a pipe change', () => {
  it('a pipe change makes a named pipe at a free path and fails with exists on a path that exists', async () => {
    const files = memoryFilesOver({ entries: [{ path: 'taken', kind: 'directory' }] })

    const outcomes = await files.apply([{ kind: 'pipe', path: 'run/events' }])
    const refused = await files.apply([{ kind: 'pipe', path: 'taken' }])

    expect(outcomes).toEqual([{ kind: 'applied' }])
    expect(refused).toEqual([{ kind: 'failed', reason: 'exists' }])
    expect(files.state().entries).toContainEqual({ path: 'run/events', kind: 'pipe' })
  })
})
