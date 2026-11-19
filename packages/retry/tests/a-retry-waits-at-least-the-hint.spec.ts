import { createMemoryClock } from '@ai-swfactory-oss/clock/memory'
import type { Failure } from '@ai-swfactory-oss/sdk-vocabulary'
import { describe, expect, it } from 'vitest'

import type { RetryPolicy } from '../src/index'
import { retried, type Tried } from './loop'

const rateLimited = (minimumWaitMs: number): Failure => ({
  category: 'transient',
  message: 'asked to wait',
  retryable: true,
  retryHint: { minimumWaitMs },
})

const run = async (failure: Failure, policy: RetryPolicy) => {
  const clock = createMemoryClock({ now: 0 })
  const triedAt: number[] = []
  const attempt = (): Promise<Tried<string>> => {
    triedAt.push(clock.now())
    return Promise.resolve(triedAt.length < policy.maxAttempts ? { ok: false, failure } : { ok: true, value: 'done' })
  }
  const outcome = await retried(policy, clock, attempt)
  return { outcome, triedAt }
}

describe('the retry loop and a retry hint', () => {
  it('waits for the hint when it asks for longer than the backoff', async () => {
    expect(await run(rateLimited(60_000), { maxAttempts: 3, backoffMs: 100, multiplier: 2 })).toEqual({
      outcome: { ok: true, value: 'done', attempts: 3 },
      triedAt: [0, 60_000, 120_000],
    })
  })

  it('waits for the backoff when it is longer than the hint', async () => {
    expect((await run(rateLimited(50), { maxAttempts: 3, backoffMs: 100, multiplier: 2 })).triedAt).toEqual([0, 100, 300])
  })

  it('caps the backoff, but never below the hint', async () => {
    expect((await run(rateLimited(0), { maxAttempts: 4, backoffMs: 100, multiplier: 10, maxBackoffMs: 500 })).triedAt).toEqual([
      0, 100, 600, 1_100,
    ])
    expect((await run(rateLimited(2_000), { maxAttempts: 2, backoffMs: 100, maxBackoffMs: 500 })).triedAt).toEqual([0, 2_000])
  })

  it('gives up with the last failure once the tries are used, having waited at least the hint before each', async () => {
    const failure = rateLimited(1_000)
    const clock = createMemoryClock({ now: 0 })
    const triedAt: number[] = []
    const attempt = (): Promise<Tried<string>> => {
      triedAt.push(clock.now())
      return Promise.resolve({ ok: false, failure })
    }

    const outcome = await retried({ maxAttempts: 3, backoffMs: 10 }, clock, attempt)

    expect([outcome, triedAt, clock.state()]).toEqual([{ ok: false, failure, attempts: 3 }, [0, 1_000, 2_000], { now: 2_000 }])
  })
})
