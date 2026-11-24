import { describe, expect, it } from 'vitest'

import { type ContainerEngine, createContainerProcess } from '../src/container/index'
import { createMemoryProcess } from '../src/memory/index'
import { clientEntry, dataFor, DOCKER, PODMAN, RUN } from './container-fixtures'

const onMacos = (engine: ContainerEngine): Promise<unknown> =>
  createContainerProcess(dataFor(engine), { process: createMemoryProcess({ entries: [clientEntry(engine, 'darwin')] }) }).execute(RUN)

const UNSUPPORTED = {
  kind: 'not-started',
  reason: 'unsupported-host',
  message: 'the container adapter runs on linux only, and the engine client runs on darwin',
}

describe('the container adapter on macos returns unsupported-host', () => {
  it('on macos the adapter returns unsupported-host', async () => {
    expect([await onMacos(DOCKER), await onMacos(PODMAN)]).toStrictEqual([UNSUPPORTED, UNSUPPORTED])
  })
})
