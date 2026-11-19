import { describe, expect, it } from 'vitest'

import type { ProcessEntryJson } from '../src/index'
import { parseProcessState } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { LINT_ENTRY } from './fixtures'

const withPackage = (name: string): ProcessEntryJson => ({
  ...LINT_ENTRY,
  invocation: { ...LINT_ENTRY.invocation, program: { package: name, version: '1.0.0' } },
})

const thrownBy = (build: () => unknown): unknown => {
  try {
    build()
  } catch (error: unknown) {
    return error
  }
  return undefined
}

const PATHS = [
  ['absolute', '/usr/bin/x'],
  ['absolute with a backslash', '\\usr\\bin\\x'],
  ['absolute on a drive', 'C:\\bin\\x.exe'],
  ['relative to the current folder', './x'],
  ['relative to the parent folder', '../x'],
  ['the current folder', '.'],
  ['the parent folder', '..'],
  ['holding a separator', 'bin/x'],
  ['holding a backslash separator', 'bin\\x'],
  ['a scope followed by a path', '@scope/bin/x'],
  ['a scope followed by a parent folder', '@scope/..'],
] as const

const NAMES = [
  ['unscoped', 'yamllint'],
  ['scoped', '@ai-swfactory-oss/yamllint'],
  ['with dots, dashes and underscores', 'lodash.merge-x_y'],
] as const

describe('a program identity that is a path', () => {
  it.each(PATHS)('is not parsed from a state when %s', (_, name) => {
    expect(parseProcessState({ entries: [withPackage(name)] })).toBeUndefined()
  })

  it.each(PATHS)('refuses to build the memory process with a named error when %s', (_, name) => {
    const error = thrownBy(() => createMemoryProcess({ entries: [withPackage(name)] }))

    expect(error).toBeInstanceOf(Error)
    expect(error instanceof Error ? error.name : undefined).toBe('PathProgramIdentityError')
  })

  it('is not parsed even when only one of several entries holds it', () => {
    expect(parseProcessState({ entries: [LINT_ENTRY, withPackage('/usr/bin/x')] })).toBeUndefined()
  })
})

describe('a program identity that is a package name in npm form', () => {
  it.each(NAMES)('is parsed from a state when %s', (_, name) => {
    expect(parseProcessState({ entries: [withPackage(name)] })).toEqual({ entries: [withPackage(name)] })
  })

  it.each(NAMES)('builds the memory process when %s', (_, name) => {
    expect(createMemoryProcess({ entries: [withPackage(name)] }).state().entries).toHaveLength(1)
  })
})
