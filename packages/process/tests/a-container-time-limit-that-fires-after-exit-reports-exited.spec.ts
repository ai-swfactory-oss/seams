import { encodeBase64 } from '@ai-swfactory-oss/bytes'
import { describe, expect, it } from 'vitest'

import { createContainerProcess } from '../src/container/index'
import { createMemoryProcess } from '../src/memory/index'
import {
  clientEntry,
  copyInEntry,
  copyOutEntry,
  createEntry,
  dataFor,
  diffEntry,
  DOCKER,
  inspectEntry,
  LINT_EXECUTION,
  removeEntry,
  REPORT,
  RUN,
  startEntry,
} from './container-fixtures'
import { text } from './fixtures'

const TIME_LIMIT_MS = 2000

describe('a container time limit that fires after exit reports exited', () => {
  it("a container run whose time limit fires after the process exited ends exited with the process's exit code", async () => {
    const engine = createMemoryProcess({
      entries: [
        clientEntry(DOCKER, 'linux'),
        createEntry(DOCKER),
        copyInEntry(DOCKER),
        startEntry(DOCKER, { kind: 'timed-out', stdout: encodeBase64(text(REPORT)), stderr: '', changes: [] }, TIME_LIMIT_MS),
        inspectEntry(DOCKER, { Status: 'exited', Running: false, ExitCode: 1 }),
        diffEntry(DOCKER),
        copyOutEntry(DOCKER),
        removeEntry(DOCKER),
      ],
    })
    const container = createContainerProcess(dataFor(DOCKER), { process: engine })

    expect(await container.execute({ ...RUN, timeLimitMs: TIME_LIMIT_MS })).toStrictEqual(LINT_EXECUTION)
  })
})
