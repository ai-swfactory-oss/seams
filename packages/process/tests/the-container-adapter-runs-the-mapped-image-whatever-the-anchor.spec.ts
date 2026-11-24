import { describe, expect, it } from 'vitest'

import { createContainerProcess } from '../src/container/index'
import type { Invocation } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { dataFor, DOCKER, LINT_EXECUTION, lintRun, RUN } from './container-fixtures'

const AS_A_MODULE: Invocation = {
  ...RUN,
  location: { anchor: 'file:///elsewhere/index.js', module: '@ai-swfactory-oss/yamllint/dist/cli.js' },
}
const IN_THE_ROOT: Invocation = { ...RUN, location: 'bundles/yamllint/bin/yamllint' }

describe('the container adapter runs the mapped image whatever the anchor', () => {
  it("a run whose identity is in images runs the mapped image whatever the invocation's anchor and returns its upper-layer changes in the linux node adapter's change type", async () => {
    const container = createContainerProcess(dataFor(DOCKER), { process: createMemoryProcess({ entries: lintRun(DOCKER) }) })

    const executions = [await container.execute(RUN), await container.execute(AS_A_MODULE), await container.execute(IN_THE_ROOT)]

    expect(executions).toStrictEqual([LINT_EXECUTION, LINT_EXECUTION, LINT_EXECUTION])
  })
})
