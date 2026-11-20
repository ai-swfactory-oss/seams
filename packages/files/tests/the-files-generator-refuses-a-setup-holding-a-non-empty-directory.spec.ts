import { describe, expect, it } from 'vitest'

import { generateFilesResults } from '../src/generate/index'
import type { TreeJson } from '../src/index'
import { memoryFilesOver } from './memory-files'

const SETUP: TreeJson = {
  entries: [
    { path: 'a', kind: 'directory' },
    { path: 'a/b', kind: 'symlink', target: '../c' },
  ],
}

describe('the files generator refuses a setup holding a non-empty directory', () => {
  it('returns a refusal as data naming the path, and applies nothing', async () => {
    const files = memoryFilesOver({ entries: [] })

    const refused = await generateFilesResults({ setup: SETUP, selection: { root: '', include: [], exclude: [] }, changes: [] }, { files })

    expect([refused, files.state()]).toEqual([{ kind: 'non-empty-directory', path: 'a' }, { entries: [] }])
  })
})
