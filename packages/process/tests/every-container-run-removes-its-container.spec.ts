import { describe, expect, it } from 'vitest'

import { createContainerProcess } from '../src/container/index'
import type { ProcessEntryJson } from '../src/index'
import { createMemoryProcess, UnknownInvocationError } from '../src/memory/index'
import {
  clientEntry,
  copyInEntry,
  createEntry,
  dataFor,
  diffEntry,
  DOCKER,
  engineEntry,
  exited,
  ID,
  inspectEntry,
  lintRun,
  removeEntry,
  RUN,
  startEntry,
} from './container-fixtures'

const TIME_LIMIT_MS = 5000

const FAILED_COPY_IN: ProcessEntryJson[] = [
  clientEntry(DOCKER, 'linux'),
  createEntry(DOCKER),
  { ...copyInEntry(DOCKER), execution: exited('', 1, 'Error response from daemon: no space left on device') },
  removeEntry(DOCKER),
]

const TIMED_OUT: ProcessEntryJson[] = [
  clientEntry(DOCKER, 'linux'),
  createEntry(DOCKER),
  copyInEntry(DOCKER),
  startEntry(DOCKER, { kind: 'timed-out', stdout: '', stderr: '', changes: [] }, TIME_LIMIT_MS),
  inspectEntry(DOCKER, { Status: 'running', Running: true, ExitCode: 0 }),
  diffEntry(DOCKER, ''),
  engineEntry(DOCKER, ['cp', `${ID}:/work`, '-'], exited(new Uint8Array(1024))),
  removeEntry(DOCKER),
]

const REMOVAL = removeEntry(DOCKER).invocation

const withoutRemoval = (entries: readonly ProcessEntryJson[]): ProcessEntryJson[] =>
  entries.filter(entry => entry.invocation.args[0] !== 'rm')

const outcomeOf = async (entries: readonly ProcessEntryJson[], timeLimitMs?: number): Promise<unknown> => {
  const container = createContainerProcess(dataFor(DOCKER), { process: createMemoryProcess({ entries }) })
  try {
    return (await container.execute(timeLimitMs === undefined ? RUN : { ...RUN, timeLimitMs })).kind
  } catch (error) {
    return error instanceof UnknownInvocationError ? { unscripted: error.invocation } : error
  }
}

describe('every container run removes its container', () => {
  it('every run removes its container including after a failed or timed-out run', async () => {
    const scenarios: readonly (readonly [readonly ProcessEntryJson[], number | undefined])[] = [
      [lintRun(DOCKER), undefined],
      [FAILED_COPY_IN, undefined],
      [TIMED_OUT, TIME_LIMIT_MS],
    ]

    const removed = await Promise.all(scenarios.map(([entries, limit]) => outcomeOf(entries, limit)))
    const unremoved = await Promise.all(scenarios.map(([entries, limit]) => outcomeOf(withoutRemoval(entries), limit)))

    expect([removed, unremoved]).toStrictEqual([
      ['exited', 'not-started', 'timed-out'],
      [{ unscripted: REMOVAL }, { unscripted: REMOVAL }, { unscripted: REMOVAL }],
    ])
  })
})
