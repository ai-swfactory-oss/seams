import { describe, expect, it } from 'vitest'

import type { ProcessState } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { LINT, LINT_ENTRY } from './fixtures'

const assumedState = (value: unknown): value is ProcessState => typeof value === 'object' && value !== null

const readState = (text: string): ProcessState => {
  const value: unknown = JSON.parse(text)
  if (!assumedState(value)) throw new Error('the JSON text is not an object')
  return value
}

const thrownBy = (build: () => unknown): unknown => {
  try {
    build()
  } catch (error: unknown) {
    return error
  }
  return undefined
}

const nameOf = (error: unknown): string | undefined => (error instanceof Error ? error.name : undefined)

const withStdout42 = JSON.stringify({
  entries: [{ ...LINT_ENTRY, execution: { ...LINT_ENTRY.execution, stdout: 42 } }],
})

const INVALID = [
  ['an execution whose stdout is a number', withStdout42],
  ['no entries', JSON.stringify({})],
  ['entries that are not a list', JSON.stringify({ entries: 'none' })],
  ['an entry with no invocation', JSON.stringify({ entries: [{ execution: LINT_ENTRY.execution }] })],
  [
    'an invocation with no program',
    JSON.stringify({ entries: [{ ...LINT_ENTRY, invocation: { ...LINT_ENTRY.invocation, program: null } }] }),
  ],
  [
    'an execution of an unknown kind',
    JSON.stringify({ entries: [{ ...LINT_ENTRY, execution: { ...LINT_ENTRY.execution, kind: 'vanished' } }] }),
  ],
] as const

describe('building the memory process from a state that is not a process state', () => {
  it.each(INVALID)('throws a named error when the state holds %s', (_, text) => {
    const error = thrownBy(() => createMemoryProcess(readState(text)))

    expect(error).toBeInstanceOf(Error)
    expect(nameOf(error)).toBe('InvalidProcessStateError')
  })

  it('throws while building, not later at execute inside the base64 codec', () => {
    const error = thrownBy(() => createMemoryProcess(readState(withStdout42)))

    expect(nameOf(error)).toBe('InvalidProcessStateError')
  })
})

describe('building the memory process from a valid state read from JSON', () => {
  it('builds the adapter as before and answers its invocation', async () => {
    const process = createMemoryProcess(readState(JSON.stringify({ entries: [LINT_ENTRY] })))

    expect(process.state()).toEqual({ entries: [LINT_ENTRY] })
    expect(await process.execute(LINT)).toEqual({
      kind: 'exited',
      exitCode: 0,
      stdout: new Uint8Array(),
      stderr: new Uint8Array(),
      changes: [],
    })
  })
})
