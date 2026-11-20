import { describe, expect, it } from 'vitest'

import { generateProcessEntries } from '../src/generate/index'
import type { InvocationJson } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { LINT, LINT_ENTRY } from './fixtures'

const WITH_A_NON_EMPTY_DIRECTORY: InvocationJson = {
  ...LINT_ENTRY.invocation,
  input: {
    entries: [
      { path: 'config', kind: 'directory' },
      { path: 'config/a.yaml', kind: 'file', content: 'YTogMQo=', executable: false },
    ],
  },
}

describe('the process generator refuses a run whose input holds a non-empty directory', () => {
  it('returns a refusal as data naming the run and the path', async () => {
    const process = createMemoryProcess({ entries: [LINT_ENTRY] })

    const refused = await generateProcessEntries(
      {
        runs: [
          { invocation: LINT_ENTRY.invocation, location: LINT.location },
          { invocation: WITH_A_NON_EMPTY_DIRECTORY, location: LINT.location },
        ],
      },
      { process },
    )

    expect(refused).toEqual({ kind: 'non-empty-directory', path: 'config', run: 2 })
  })
})
