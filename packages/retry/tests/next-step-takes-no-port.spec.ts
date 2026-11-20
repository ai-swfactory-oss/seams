import { createMemoryClock } from '@ai-swfactory-oss/clock/memory'
import type { Failure } from '@ai-swfactory-oss/sdk-vocabulary'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { createRetrySdk, InvalidPolicyError, nextCheck, nextStep, type PollPolicy, type RetryPolicy, type RetryPorts } from '../src/index'

const UNAVAILABLE: Failure = { category: 'transient', message: 'try again', retryable: true, retryHint: { minimumWaitMs: 250 } }

describe('nextStep takes no port', () => {
  it('takes only data: a policy, a count and a failure', () => {
    expectTypeOf(nextStep).parameters.toEqualTypeOf<[RetryPolicy, number, Failure]>()
    expectTypeOf(nextCheck).parameters.toEqualTypeOf<[PollPolicy, number, number, Failure | undefined]>()
    expect([nextStep.length, nextCheck.length]).toEqual([3, 4])
  })

  it('decides from that data alone, the same way every time, as plain data', () => {
    const steps = [1, 2, 3].map(() => nextStep({ maxAttempts: 3, backoffMs: 100 }, 1, UNAVAILABLE))

    expect([steps, JSON.parse(JSON.stringify(steps))]).toEqual([
      [{ wait: 250 }, { wait: 250 }, { wait: 250 }],
      [{ wait: 250 }, { wait: 250 }, { wait: 250 }],
    ])
  })
})

describe('only createRetrySdk takes the clock port', () => {
  it('takes a policy and the clock port, and gives only waitFor', () => {
    expectTypeOf(createRetrySdk).parameters.toEqualTypeOf<[RetryPolicy | PollPolicy, RetryPorts]>()
    expect(Object.keys(createRetrySdk({ maxAttempts: 2, backoffMs: 0 }, { clock: createMemoryClock({ now: 0 }) }))).toEqual(['waitFor'])
  })

  it('waits out a step on the clock it was given, and nowhere else', async () => {
    const clock = createMemoryClock({ now: 0 })
    const other = createMemoryClock({ now: 0 })
    const { waitFor } = createRetrySdk({ maxAttempts: 3, backoffMs: 100 }, { clock })

    const step = nextStep({ maxAttempts: 3, backoffMs: 100 }, 1, UNAVAILABLE)
    if ('stop' in step) throw new Error('expected a wait')
    await waitFor(step)
    const afterStep = clock.state()
    await waitFor({ wait: 0 })

    expect([afterStep, clock.state(), other.state()]).toEqual([{ now: 250 }, { now: 250 }, { now: 0 }])
  })

  it('refuses a policy whose numbers are not finite and zero or more, naming it', () => {
    const clock = createMemoryClock({ now: 0 })
    const refused = [
      { maxAttempts: Number.NaN, backoffMs: 0 },
      { maxAttempts: 1, backoffMs: -1 },
      { maxAttempts: 1, backoffMs: 0, multiplier: Number.POSITIVE_INFINITY },
      { maxAttempts: 1, backoffMs: 0, maxBackoffMs: -5 },
      { intervalMs: -1, timeoutMs: 0 },
      { intervalMs: 0, timeoutMs: 1_000 },
      { intervalMs: 1, timeoutMs: Number.NaN },
    ].map(policy => {
      try {
        createRetrySdk(policy, { clock })
        return 'accepted'
      } catch (error: unknown) {
        return error instanceof InvalidPolicyError ? error.field : 'other'
      }
    })

    expect(refused).toEqual(['maxAttempts', 'backoffMs', 'multiplier', 'maxBackoffMs', 'intervalMs', 'intervalMs', 'timeoutMs'])
  })
})
