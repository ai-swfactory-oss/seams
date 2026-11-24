import { describe, expect, it } from 'vitest'

import { createContainerProcess } from '../src/container/index'
import { createMemoryProcess } from '../src/memory/index'
import { clientEntry, dataFor, DOCKER, RUN } from './container-fixtures'

describe('a container run whose identity is not in images is not started', () => {
  it('a run whose identity is not in images returns not-started', async () => {
    const container = createContainerProcess(dataFor(DOCKER), { process: createMemoryProcess({ entries: [clientEntry(DOCKER, 'linux')] }) })

    const execution = await container.execute({ ...RUN, program: { package: '@ai-swfactory-oss/shellcheck', version: '0.10.0' } })

    expect(execution).toStrictEqual({
      kind: 'not-started',
      reason: 'not-found',
      message: 'no image is mapped for @ai-swfactory-oss/shellcheck@0.10.0',
    })
  })
})
