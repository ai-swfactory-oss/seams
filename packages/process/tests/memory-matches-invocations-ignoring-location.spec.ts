import { describe, expect, it } from 'vitest'

import { generateProcessEntries } from '../src/generate/index'
import type { Invocation } from '../src/index'
import { invocationToJson } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { LINT, LINT_ENTRY, text } from './fixtures'

const EXITED = { kind: 'exited', exitCode: 0, stdout: new Uint8Array(), stderr: new Uint8Array(), changes: [] }

const AS_A_MODULE: Invocation = {
  ...LINT,
  location: { anchor: 'file:///elsewhere/index.js', module: '@ai-swfactory-oss/yamllint/dist/cli.js' },
}
const IN_THE_ROOT: Invocation = { ...LINT, location: 'bundles/yamllint/bin/yamllint' }

describe('the memory process', () => {
  it('two invocations that differ only in their location match the same memory-adapter state and give the same key', async () => {
    const memory = createMemoryProcess({ entries: [LINT_ENTRY] })

    const executions = [await memory.execute(LINT), await memory.execute(AS_A_MODULE), await memory.execute(IN_THE_ROOT)]
    const keys = [invocationToJson(LINT), invocationToJson(AS_A_MODULE), invocationToJson(IN_THE_ROOT)]

    expect(executions).toEqual([EXITED, EXITED, EXITED])
    expect(keys).toStrictEqual([LINT_ENTRY.invocation, LINT_ENTRY.invocation, LINT_ENTRY.invocation])
  })

  it('generated state and InvocationJson hold no location field', async () => {
    const process = createMemoryProcess({ entries: [LINT_ENTRY] })

    const generated = await generateProcessEntries({ runs: [{ invocation: LINT_ENTRY.invocation, location: LINT.location }] }, { process })

    expect(generated).toStrictEqual({ kind: 'entries', state: { entries: [LINT_ENTRY] } })
    expect(Object.keys(invocationToJson(AS_A_MODULE))).not.toContain('location')
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
