import type { Failure } from '@ai-swfactory-oss/sdk-vocabulary'
import { describe, expect, it } from 'vitest'

import { nextStep } from '../src/index'

const NOT_FOUND: Failure = { category: 'permanent', message: 'no such repository', retryable: false }
const UNAVAILABLE: Failure = { category: 'transient', message: 'try again', retryable: true }
const HINTED_BUT_FINAL: Failure = { category: 'transient', message: 'gone for good', retryable: false, retryHint: { minimumWaitMs: 5_000 } }
const POLICY = { maxAttempts: 3, backoffMs: 100, multiplier: 2 }

describe('nextStep', () => {
  it('stops at once at a failure whose data says it is not retryable', () => {
    expect(nextStep(POLICY, 1, NOT_FOUND)).toEqual({ stop: { ok: false, failure: NOT_FOUND, attempts: 1 } })
  })

  it('stops at a non-retryable failure even when it carries a retry hint, and even after retryable ones', () => {
    expect(nextStep({ ...POLICY, maxAttempts: 5 }, 2, HINTED_BUT_FINAL)).toEqual({
      stop: { ok: false, failure: HINTED_BUT_FINAL, attempts: 2 },
    })
  })

  it('waits before trying a retryable failure again, with growing waits', () => {
    expect([nextStep(POLICY, 1, UNAVAILABLE), nextStep(POLICY, 2, UNAVAILABLE)]).toEqual([{ wait: 100 }, { wait: 200 }])
  })

  it('returns running out of attempts as data, with the last failure', () => {
    expect(nextStep(POLICY, 3, UNAVAILABLE)).toEqual({ stop: { ok: false, failure: UNAVAILABLE, attempts: 3 } })
  })

  it('asks only for finite waits of zero or more, even from a policy the entry would refuse', () => {
    const waits = [
      { maxAttempts: 2, backoffMs: -100 },
      { maxAttempts: 2, backoffMs: Number.NaN },
      { maxAttempts: 2, backoffMs: Number.POSITIVE_INFINITY },
      { maxAttempts: 2_000, backoffMs: 100, multiplier: 10 },
    ].map((policy, index) => nextStep(policy, index === 3 ? 1_000 : 1, UNAVAILABLE))

    expect(waits).toEqual([{ wait: 0 }, { wait: 0 }, { wait: Number.MAX_SAFE_INTEGER }, { wait: Number.MAX_SAFE_INTEGER }])
  })

  it('always allows one try, and never more than a whole number of tries', () => {
    const allowed = [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 2.9].map(
      maxAttempts => [1, 2, 3].filter(attempts => 'wait' in nextStep({ maxAttempts, backoffMs: 0 }, attempts, UNAVAILABLE)).length + 1,
    )

    expect(allowed).toEqual([1, 1, 1, 1, 2])
  })
})
