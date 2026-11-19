import { describe, expect, it } from 'vitest'

import { createMemoryProcess, UnknownInvocationError } from '../src/memory/index'
import { LINT, LINT_ENTRY } from './fixtures'

describe('the memory process with no entry for an invocation', () => {
  it('throws the named error for different args', async () => {
    const memory = createMemoryProcess({ entries: [LINT_ENTRY] })

    await expect(memory.execute({ ...LINT, args: ['b.yaml'] })).rejects.toBeInstanceOf(UnknownInvocationError)
  })

  it('throws the named error for a different input tree', async () => {
    const memory = createMemoryProcess({ entries: [LINT_ENTRY] })

    await expect(memory.execute({ ...LINT, input: { entries: [] } })).rejects.toBeInstanceOf(UnknownInvocationError)
  })

  it('throws the named error for a different environment value', async () => {
    const memory = createMemoryProcess({ entries: [LINT_ENTRY] })

    await expect(memory.execute({ ...LINT, env: { ...LINT.env, HOME: '/home/ada' } })).rejects.toBeInstanceOf(UnknownInvocationError)
  })

  it('throws the named error from an empty table', async () => {
    await expect(createMemoryProcess({ entries: [] }).execute(LINT)).rejects.toBeInstanceOf(UnknownInvocationError)
  })
})
