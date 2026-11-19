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

const rejectionOf = (pending: Promise<unknown>): Promise<unknown> =>
  pending.then(
    () => undefined,
    (reason: unknown) => reason,
  )

const nameOf = (error: unknown): string | undefined => (error instanceof Error ? error.name : undefined)

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : '')

describe('the process generator refuses a run whose input holds a non-empty directory', () => {
  it('rejects with a NonEmptyDirectoryError naming the generator, the call and the path', async () => {
    const process = createMemoryProcess({ entries: [LINT_ENTRY] })

    const error = await rejectionOf(
      generateProcessEntries(
        {
          runs: [
            { invocation: LINT_ENTRY.invocation, location: LINT.location },
            { invocation: WITH_A_NON_EMPTY_DIRECTORY, location: LINT.location },
          ],
        },
        { process },
      ),
    )

    expect([nameOf(error), messageOf(error)]).toEqual([
      'NonEmptyDirectoryError',
      'generateProcessEntries refuses run 2 (@ai-swfactory-oss/yamllint@1.37.1 -f parsable a.yaml): its input holds the non-empty directory config',
    ])
  })
})
