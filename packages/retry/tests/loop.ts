import type { Clock } from '@ai-swfactory-oss/clock'
import type { Failure } from '@ai-swfactory-oss/sdk-vocabulary'

import { createRetry, nextCheck, nextStep, type Outcome, type PollPolicy, type RetryPolicy } from '../src/index'

export type Tried<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly failure: Failure }

export const retried = async <T>(policy: RetryPolicy, clock: Clock, attempt: () => Promise<Tried<T>>): Promise<Outcome<T>> => {
  const { waitFor } = createRetry(policy, { clock })
  for (let attempts = 1; ; attempts += 1) {
    const tried = await attempt()
    if (tried.ok) return { ok: true, value: tried.value, attempts }
    const step = nextStep(policy, attempts, tried.failure)
    if ('stop' in step) return step.stop
    await waitFor(step)
  }
}

export type Checked<T> =
  | { readonly kind: 'held'; readonly value: T }
  | { readonly kind: 'not-yet' }
  | { readonly kind: 'failed'; readonly failure: Failure }

export const polled = async <T>(policy: PollPolicy, clock: Clock, check: () => Promise<Checked<T>>): Promise<Outcome<T>> => {
  const { waitFor } = createRetry(policy, { clock })
  const start = clock.now()
  for (let checks = 1; ; checks += 1) {
    const checked = await check()
    if (checked.kind === 'held') return { ok: true, value: checked.value, attempts: checks }
    const step = nextCheck(policy, checks, clock.now() - start, checked.kind === 'failed' ? checked.failure : undefined)
    if ('stop' in step) return step.stop
    await waitFor(step)
  }
}
