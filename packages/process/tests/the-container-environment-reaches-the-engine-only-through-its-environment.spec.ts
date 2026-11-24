import { describe, expect, it } from 'vitest'

import { createContainerProcess } from '../src/container/index'
import { createMemoryProcess } from '../src/memory/index'
import { dataFor, DOCKER, LINT_EXECUTION, lintRun, RUN } from './container-fixtures'

const ENTRIES = lintRun(DOCKER)

describe('the container environment reaches the engine only through its environment', () => {
  it("the environment never appears in the engine's argv and reaches the engine only through the engine process's environment", async () => {
    const container = createContainerProcess(dataFor(DOCKER), { process: createMemoryProcess({ entries: ENTRIES }) })
    const values = Object.values(RUN.env)

    const execution = await container.execute(RUN)

    expect([
      execution,
      ENTRIES.some(entry => entry.invocation.args.some(arg => values.some(value => arg.includes(value)))),
      ENTRIES.map(entry => [entry.invocation.args[0], entry.invocation.env]),
    ]).toStrictEqual([
      LINT_EXECUTION,
      false,
      [
        ['version', {}],
        ['create', RUN.env],
        ['cp', {}],
        ['start', {}],
        ['inspect', {}],
        ['diff', {}],
        ['cp', {}],
        ['rm', {}],
      ],
    ])
  })
})
