import type { Clock } from '@ai-swfactory-oss/clock'
import type { Failure } from '@ai-swfactory-oss/sdk-vocabulary'

export interface Stopped {
  readonly ok: false
  readonly failure: Failure
  readonly attempts: number
}

export type Outcome<T> = { readonly ok: true; readonly value: T; readonly attempts: number } | Stopped

export interface Wait {
  readonly wait: number
}

export type Step = Wait | { readonly stop: Stopped }

export interface RetryPolicy {
  readonly maxAttempts: number
  readonly backoffMs: number
  readonly multiplier?: number
  readonly maxBackoffMs?: number
}

export interface PollPolicy {
  readonly intervalMs: number
  readonly timeoutMs: number
}

export interface RetryPorts {
  readonly clock: Clock
}

export interface Retry {
  readonly waitFor: (step: Wait) => Promise<void>
}
