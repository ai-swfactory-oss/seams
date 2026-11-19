import { createMemoryClock } from '@ai-swfactory-oss/clock/memory'
import type { Failure } from '@ai-swfactory-oss/sdk-vocabulary'
import { describe, expect, it } from 'vitest'

import { CONDITION_NOT_HELD, createRetry, InvalidPolicyError, nextCheck } from '../src/index'
import { type Checked, polled } from './loop'

const NOT_YET: Checked<string> = { kind: 'not-yet' }
const HELD: Checked<string> = { kind: 'held', value: 'success' }
const FORBIDDEN: Failure = { category: 'permanent', message: 'no access', retryable: false }
const BUSY: Failure = { category: 'transient', message: 'asked to wait', retryable: true, retryHint: { minimumWaitMs: 5_000 } }

const run = async (results: readonly Checked<string>[], intervalMs: number, timeoutMs: number) => {
  const clock = createMemoryClock({ now: 0 })
  const checkedAt: number[] = []
  const check = (): Promise<Checked<string>> => {
    const result = results[Math.min(checkedAt.length, results.length - 1)] ?? NOT_YET
    checkedAt.push(clock.now())
    return Promise.resolve(result)
  }
  const outcome = await polled({ intervalMs, timeoutMs }, clock, check)
  return { outcome, checkedAt }
}

describe('the poll loop', () => {
  it('ends at the first check where the condition holds, one interval apart', async () => {
    expect(await run([NOT_YET, NOT_YET, HELD], 1_000, 60_000)).toEqual({
      outcome: { ok: true, value: 'success', attempts: 3 },
      checkedAt: [0, 1_000, 2_000],
    })
  })

  it('ends at a failure that is not retryable', async () => {
    expect(await run([NOT_YET, { kind: 'failed', failure: FORBIDDEN }], 1_000, 60_000)).toEqual({
      outcome: { ok: false, failure: FORBIDDEN, attempts: 2 },
      checkedAt: [0, 1_000],
    })
  })

  it('checks again after a retryable failure, waiting for its hint', async () => {
    expect(await run([{ kind: 'failed', failure: BUSY }, HELD], 1_000, 60_000)).toEqual({
      outcome: { ok: true, value: 'success', attempts: 2 },
      checkedAt: [0, 5_000],
    })
  })

  it('stops with condition-not-held when no further check starts in time', async () => {
    expect(await run([NOT_YET], 1_000, 2_500)).toEqual({
      outcome: {
        ok: false,
        failure: {
          category: 'transient',
          message: 'The condition did not hold within 2500 ms.',
          retryable: true,
          detail: { code: CONDITION_NOT_HELD, timeoutMs: 2_500 },
        },
        attempts: 3,
      },
      checkedAt: [0, 1_000, 2_000],
    })
    expect(CONDITION_NOT_HELD).toBe('condition-not-held')
  })

  it('stops with the last failure when its hint would pass the time allowed', async () => {
    expect(await run([NOT_YET, { kind: 'failed', failure: BUSY }], 1_000, 4_000)).toEqual({
      outcome: { ok: false, failure: BUSY, attempts: 2 },
      checkedAt: [0, 1_000],
    })
  })

  it('decides a single check when no time would pass between checks, which the entry refuses', () => {
    expect(nextCheck({ intervalMs: 0, timeoutMs: 60_000 }, 1, 0, undefined)).toMatchObject({ stop: { ok: false, attempts: 1 } })
    expect(() => createRetry({ intervalMs: 0, timeoutMs: 60_000 }, { clock: createMemoryClock({ now: 0 }) })).toThrow(InvalidPolicyError)
  })
})
