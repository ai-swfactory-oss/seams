import { describe, expect, it } from 'vitest'

import type { ProcessEntryJson } from '../src/index'
import { createMemoryProcess, DuplicateInvocationError } from '../src/memory/index'
import { LINT_ENTRY } from './fixtures'

describe('building the memory process', () => {
  it('rejects two entries for the same invocation, even with different executions', () => {
    const other: ProcessEntryJson = { ...LINT_ENTRY, execution: { kind: 'timed-out', stdout: '', stderr: '', changes: [] } }

    expect(() => createMemoryProcess({ entries: [LINT_ENTRY, other] })).toThrow(DuplicateInvocationError)
  })

  it('rejects two entries whose environments differ only in the order they were written', () => {
    const reordered = {
      ...LINT_ENTRY,
      invocation: { ...LINT_ENTRY.invocation, env: { HOME: '/nonexistent', LANG: 'C.UTF-8' } },
    }

    expect(() => createMemoryProcess({ entries: [LINT_ENTRY, reordered] })).toThrow(DuplicateInvocationError)
  })

  it('accepts entries that differ in any matched field', () => {
    const otherArgs = { ...LINT_ENTRY, invocation: { ...LINT_ENTRY.invocation, args: ['a.yaml'] } }
    const otherVersion = {
      ...LINT_ENTRY,
      invocation: { ...LINT_ENTRY.invocation, program: { package: '@ai-swfactory-oss/yamllint', version: '1.38.0' } },
    }

    expect(createMemoryProcess({ entries: [LINT_ENTRY, otherArgs, otherVersion] }).state().entries).toHaveLength(3)
  })
})
