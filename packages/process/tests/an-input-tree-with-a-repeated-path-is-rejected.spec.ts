import { describe, expect, it } from 'vitest'

import type { Invocation, ProcessEntryJson } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { LINT, LINT_ENTRY, text } from './fixtures'

const A = { path: 'a.yaml', kind: 'file', content: 'YTogMQo=', executable: false } as const
const B = { path: 'a.yaml', kind: 'file', content: 'YTogMgo=', executable: false } as const
const DIRECTORY = { path: 'a.yaml', kind: 'directory' } as const
const OTHER = { path: 'b.yaml', kind: 'file', content: 'YjogMQo=', executable: false } as const

type EntryJson = typeof A | typeof B | typeof DIRECTORY | typeof OTHER

const entryWith = (...entries: readonly EntryJson[]): ProcessEntryJson => ({
  ...LINT_ENTRY,
  invocation: { ...LINT_ENTRY.invocation, input: { entries } },
})

const FILE_A = { path: 'a.yaml', kind: 'file', content: text('a: 1\n'), executable: false } as const
const FILE_B = { path: 'a.yaml', kind: 'file', content: text('a: 2\n'), executable: false } as const
const FILE_OTHER = { path: 'b.yaml', kind: 'file', content: text('b: 1\n'), executable: false } as const

const invocationWith = (...entries: readonly (typeof FILE_A | typeof FILE_B | typeof FILE_OTHER)[]): Invocation => ({
  ...LINT,
  input: { entries },
})

const thrownBy = (build: () => unknown): unknown => {
  try {
    build()
  } catch (error: unknown) {
    return error
  }
  return undefined
}

const nameOf = (error: unknown): string | undefined => (error instanceof Error ? error.name : undefined)

const REPEATED_STATES = [
  ['two files at one path, A then B', [A, B]],
  ['two files at one path, B then A', [B, A]],
  ['the same file written twice', [A, A]],
  ['a file and a directory at one path', [A, DIRECTORY]],
  ['a repeated path among other entries', [OTHER, B, A]],
] as const

describe('an input tree with a repeated path', () => {
  it.each(REPEATED_STATES)('refuses to build the memory process with a named error when %s', (_, entries) => {
    const error = thrownBy(() => createMemoryProcess({ entries: [entryWith(...entries)] }))

    expect(error).toBeInstanceOf(Error)
    expect(nameOf(error)).toBe('RepeatedInputPathError')
  })

  it('refuses to build the memory process even when only one of several entries holds it', () => {
    const error = thrownBy(() => createMemoryProcess({ entries: [LINT_ENTRY, entryWith(A, B)] }))

    expect(nameOf(error)).toBe('RepeatedInputPathError')
  })

  it.each([
    ['A then B', [FILE_A, FILE_B]],
    ['B then A', [FILE_B, FILE_A]],
    ['among other entries', [FILE_OTHER, FILE_A, FILE_B]],
  ] as const)('is rejected with a named error when executed, %s', async (_, entries) => {
    const process = createMemoryProcess({ entries: [LINT_ENTRY] })

    const error: unknown = await process.execute(invocationWith(...entries)).then(
      () => undefined,
      (reason: unknown) => reason,
    )

    expect(error).toBeInstanceOf(Error)
    expect(nameOf(error)).toBe('RepeatedInputPathError')
  })
})

describe('an input tree without a repeated path', () => {
  it('matches an invocation whose entries were written in another order', async () => {
    const process = createMemoryProcess({ entries: [entryWith(A, OTHER)] })

    const execution = await process.execute(invocationWith(FILE_OTHER, FILE_A))

    expect(execution.kind).toBe('exited')
  })

  it('makes two entries that differ only in the order of their input duplicates', () => {
    const error = thrownBy(() => createMemoryProcess({ entries: [entryWith(A, OTHER), entryWith(OTHER, A)] }))

    expect(nameOf(error)).toBe('DuplicateInvocationError')
  })
})
