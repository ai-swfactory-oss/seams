import type { PollPolicy, RetryPolicy } from '../types'

export class InvalidPolicyError extends Error {
  override readonly name = 'InvalidPolicyError'

  constructor(
    readonly field: string,
    readonly value: number,
  ) {
    super(`A policy's ${field} is a finite number, zero or more; got ${String(value)}.`)
  }
}

const isUsable = (value: number | undefined): boolean => value === undefined || (Number.isFinite(value) && value >= 0)

const fieldsOf = (policy: RetryPolicy | PollPolicy): readonly (readonly [string, number | undefined])[] =>
  'maxAttempts' in policy
    ? [
        ['maxAttempts', policy.maxAttempts],
        ['backoffMs', policy.backoffMs],
        ['multiplier', policy.multiplier],
        ['maxBackoffMs', policy.maxBackoffMs],
      ]
    : [
        ['intervalMs', policy.intervalMs],
        ['timeoutMs', policy.timeoutMs],
      ]

export const checkedPolicy = <P extends RetryPolicy | PollPolicy>(policy: P): P => {
  const refused = fieldsOf(policy).find(([, value]) => !isUsable(value))
  if (refused !== undefined) throw new InvalidPolicyError(refused[0], refused[1] ?? Number.NaN)
  return policy
}
