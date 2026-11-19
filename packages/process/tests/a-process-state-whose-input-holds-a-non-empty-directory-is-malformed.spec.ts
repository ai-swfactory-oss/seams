import { describe, expect, it } from 'vitest'

import { parseProcessState, type ProcessEntryJson, type ProcessState } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { LINT_ENTRY } from './fixtures'

const ENTRY_WITH_A_NON_EMPTY_DIRECTORY: ProcessEntryJson = {
  ...LINT_ENTRY,
  invocation: {
    ...LINT_ENTRY.invocation,
    input: {
      entries: [
        { path: 'config', kind: 'directory' },
        { path: 'config/a.yaml', kind: 'file', content: 'YTogMQo=', executable: false },
      ],
    },
  },
}

const STATE: ProcessState = { entries: [ENTRY_WITH_A_NON_EMPTY_DIRECTORY] }

const thrownBy = (build: () => unknown): unknown => {
  try {
    build()
  } catch (error: unknown) {
    return error
  }
  return undefined
}

const nameOf = (error: unknown): string | undefined => (error instanceof Error ? error.name : undefined)

describe('a process state whose input holds a non-empty directory', () => {
  it('is malformed: parseProcessState returns undefined', () => {
    expect(parseProcessState(STATE)).toBeUndefined()
  })

  it('is refused by the memory process with InvalidProcessStateError', () => {
    expect(nameOf(thrownBy(() => createMemoryProcess(STATE)))).toBe('InvalidProcessStateError')
  })
})
