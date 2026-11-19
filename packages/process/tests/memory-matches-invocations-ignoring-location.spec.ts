import { describe, expect, it } from 'vitest'

import { createMemoryProcess } from '../src/memory/index'
import { LINT, LINT_ENTRY, text } from './fixtures'

const EXITED = { kind: 'exited', exitCode: 0, stdout: new Uint8Array(), stderr: new Uint8Array(), changes: [] }

describe('the memory process', () => {
  it('answers an invocation from its entry, whatever its location', async () => {
    const memory = createMemoryProcess({ entries: [LINT_ENTRY] })

    const executions = [await memory.execute(LINT), await memory.execute({ ...LINT, location: '/somewhere/else/yamllint' })]

    expect(executions).toEqual([EXITED, EXITED])
  })

  it('matches the environment by name, not by the order it was written in', async () => {
    const memory = createMemoryProcess({ entries: [LINT_ENTRY] })

    expect(await memory.execute({ ...LINT, env: { LANG: 'C.UTF-8', HOME: '/nonexistent' } })).toEqual(EXITED)
  })

  it('serves one entry for any number of runs, and reports its state unchanged', async () => {
    const memory = createMemoryProcess({ entries: [LINT_ENTRY] })

    await memory.execute(LINT)
    await memory.execute(LINT)

    expect(memory.state()).toEqual({ entries: [LINT_ENTRY] })
  })

  it('decodes the recorded output and changes', async () => {
    const memory = createMemoryProcess({
      entries: [
        {
          invocation: LINT_ENTRY.invocation,
          execution: {
            kind: 'exited',
            exitCode: 1,
            stdout: 'YS55YW1sOjE6MQo=',
            stderr: '',
            changes: [{ kind: 'write', path: 'out.txt', content: 'aGk=', executable: false }],
          },
        },
      ],
    })

    expect(await memory.execute(LINT)).toEqual({
      kind: 'exited',
      exitCode: 1,
      stdout: text('a.yaml:1:1\n'),
      stderr: new Uint8Array(),
      changes: [{ kind: 'write', path: 'out.txt', content: text('hi'), executable: false }],
    })
  })
})
