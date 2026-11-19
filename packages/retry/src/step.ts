import type { Failure } from '@ai-swfactory-oss/sdk-vocabulary'

import { attemptLimit, backoffAfter, checkLimit, honouringHint } from './domain/wait'
import type { PollPolicy, RetryPolicy, Step } from './types'

export const CONDITION_NOT_HELD = 'condition-not-held'

const notHeldWithin = (timeoutMs: number): Failure => ({
  category: 'transient',
  message: `The condition did not hold within ${String(timeoutMs)} ms.`,
  retryable: true,
  detail: { code: CONDITION_NOT_HELD, timeoutMs },
})

const stop = (failure: Failure, attempts: number): Step => ({ stop: { ok: false, failure, attempts } })

export const nextStep = (policy: RetryPolicy, attempts: number, lastFailure: Failure): Step =>
  !lastFailure.retryable || attempts >= attemptLimit(policy)
    ? stop(lastFailure, attempts)
    : { wait: honouringHint(backoffAfter(policy, attempts), lastFailure) }

export const nextCheck = (policy: PollPolicy, checks: number, elapsedMs: number, lastFailure: Failure | undefined): Step => {
  if (lastFailure !== undefined && !lastFailure.retryable) return stop(lastFailure, checks)
  const wait = honouringHint(policy.intervalMs, lastFailure)
  return checks >= checkLimit(policy) || elapsedMs + wait > policy.timeoutMs
    ? stop(lastFailure ?? notHeldWithin(policy.timeoutMs), checks)
    : { wait }
}
