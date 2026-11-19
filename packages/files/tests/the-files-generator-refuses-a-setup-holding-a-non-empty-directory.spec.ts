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

const rejectionOf = (pending: Promise<unknown>): Promise<unknown> =>
  pending.then(
    () => undefined,
    (reason: unknown) => reason,
  )

const nameOf = (error: unknown): string | undefined => (error instanceof Error ? error.name : undefined)

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : '')

describe('the files generator refuses a setup holding a non-empty directory', () => {
  it('rejects with a NonEmptyDirectoryError naming the generator, the call and the path, and applies nothing', async () => {
    const files = memoryFilesOver({ entries: [] })

    const error = await rejectionOf(
      generateFilesResults({ setup: SETUP, selection: { root: '', include: [], exclude: [] }, changes: [] }, { files }),
    )

    expect([nameOf(error), messageOf(error), files.state()]).toEqual([
      'NonEmptyDirectoryError',
      'generateFilesResults refuses the setup: its input holds the non-empty directory a',
      { entries: [] },
    ])
  })
})
