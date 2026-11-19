import { describe, expect, it } from 'vitest'

import { invocationFromJson, type InvocationJson } from '../src/index'
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

describe('invocationFromJson', () => {
  it('returns a non-empty directory of its input as data, naming the path', () => {
    expect(invocationFromJson(WITH_A_NON_EMPTY_DIRECTORY, LINT.location)).toEqual({ kind: 'non-empty-directory', path: 'config' })
  })

  it('returns the invocation of a valid input as data', () => {
    expect(invocationFromJson(LINT_ENTRY.invocation, LINT.location)).toEqual({ kind: 'invocation', invocation: LINT })
  })
})
