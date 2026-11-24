import { describe, expect, it } from 'vitest'

import { type ContainerEngine, createContainerProcess } from '../src/container/index'
import { createMemoryProcess } from '../src/memory/index'
import { dataFor, DOCKER, LINT_EXECUTION, lintRun, PODMAN, RUN } from './container-fixtures'

const runWith = (engine: ContainerEngine): Promise<unknown> =>
  createContainerProcess(dataFor(engine), { process: createMemoryProcess({ entries: lintRun(engine) }) }).execute(RUN)

describe('the same container run succeeds with docker and podman', () => {
  it('the same run succeeds when the engine identity is docker and when it is podman', async () => {
    expect([await runWith(DOCKER), await runWith(PODMAN)]).toStrictEqual([LINT_EXECUTION, LINT_EXECUTION])
  })
})
