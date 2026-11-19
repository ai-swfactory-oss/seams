import type { Failure } from '@ai-swfactory-oss/sdk-vocabulary'

import type { PollPolicy, RetryPolicy } from '../types'

const DEFAULT_MULTIPLIER = 1

export const backoffAfter = (policy: RetryPolicy, attempts: number): number => {
  const raw = policy.backoffMs * (policy.multiplier ?? DEFAULT_MULTIPLIER) ** (attempts - 1)
  return policy.maxBackoffMs === undefined ? raw : Math.min(raw, policy.maxBackoffMs)
}

export const honouringHint = (planned: number, failure: Failure | undefined): number =>
  Math.max(planned, failure?.retryHint?.minimumWaitMs ?? 0)

export const attemptLimit = (policy: RetryPolicy): number =>
  Number.isFinite(policy.maxAttempts) ? Math.max(1, Math.floor(policy.maxAttempts)) : 1

export const checkLimit = (policy: PollPolicy): number =>
  Number.isFinite(policy.intervalMs) && policy.intervalMs > 0 && Number.isFinite(policy.timeoutMs) && policy.timeoutMs > 0
    ? Math.floor(policy.timeoutMs / policy.intervalMs) + 1
    : 1
