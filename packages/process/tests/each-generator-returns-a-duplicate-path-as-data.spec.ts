import { generateFilesResults } from '@ai-swfactory-oss/files/generate'
import { createMemoryFiles } from '@ai-swfactory-oss/files/memory'
import { assert, describe, expect, it } from 'vitest'

import { generateProcessEntries } from '../src/generate/index'
import type { InvocationJson } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { LINT, LINT_ENTRY } from './fixtures'

const WITH_A_DUPLICATE_PATH: InvocationJson = {
  ...LINT_ENTRY.invocation,
  input: {
    entries: [
      { path: 'config.yaml', kind: 'file', content: 'YTogMQo=', executable: false },
      { path: 'config.yaml', kind: 'file', content: 'YTogMgo=', executable: false },
    ],
  },
}

describe('each generator returns a duplicate path as data', () => {
  it('the files generator returns the duplicate-path refusal for a setup that repeats a path, and applies nothing', async () => {
    const created = createMemoryFiles({ entries: [] })
    assert(created.kind === 'files', 'the initial tree is refused')
    const { files } = created

    const refused = await generateFilesResults(
      { setup: WITH_A_DUPLICATE_PATH.input, selection: { root: '', include: [], exclude: [] }, changes: [] },
      { files },
    )

    expect([refused, files.state()]).toEqual([{ kind: 'duplicate-path', path: 'config.yaml' }, { entries: [] }])
  })

  it('the process generator returns the duplicate-path refusal naming the run whose input repeats a path', async () => {
    const process = createMemoryProcess({ entries: [LINT_ENTRY] })

    await expect(
      generateProcessEntries(
        {
          runs: [
            { invocation: LINT_ENTRY.invocation, location: LINT.location },
            { invocation: WITH_A_DUPLICATE_PATH, location: LINT.location },
          ],
        },
        { process },
      ),
    ).resolves.toEqual({ kind: 'duplicate-path', path: 'config.yaml', run: 2 })
  })
})
