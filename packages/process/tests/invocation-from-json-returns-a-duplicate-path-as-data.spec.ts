import { describe, expect, it } from 'vitest'

import { invocationFromJson, type InvocationJson } from '../src/index'
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

describe('invocationFromJson returns a duplicate path as data', () => {
  it('returns the duplicate-path refusal naming the path its input gives twice', () => {
    expect(invocationFromJson(WITH_A_DUPLICATE_PATH, LINT.location)).toEqual({ kind: 'duplicate-path', path: 'config.yaml' })
  })
})
