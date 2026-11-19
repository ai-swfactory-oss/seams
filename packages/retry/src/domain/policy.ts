import type { PollPolicy, RetryPolicy } from '../types'

export class InvalidPolicyError extends Error {
  override readonly name = 'InvalidPolicyError'

  constructor(
    readonly field: string,
    readonly value: number,
    readonly least: 'zero or more' | 'more than zero',
  ) {
    super(`A policy's ${field} is a finite number, ${least}; got ${String(value)}.`)
  }
}

type Field = readonly [string, number | undefined, 'zero or more' | 'more than zero']

const isUsable = ([, value, least]: Field): boolean =>
  value === undefined || (Number.isFinite(value) && (least === 'zero or more' ? value >= 0 : value > 0))

const fieldsOf = (policy: RetryPolicy | PollPolicy): readonly Field[] =>
  'maxAttempts' in policy
    ? [
        ['maxAttempts', policy.maxAttempts, 'zero or more'],
        ['backoffMs', policy.backoffMs, 'zero or more'],
        ['multiplier', policy.multiplier, 'zero or more'],
        ['maxBackoffMs', policy.maxBackoffMs, 'zero or more'],
      ]
    : [
        ['intervalMs', policy.intervalMs, 'more than zero'],
        ['timeoutMs', policy.timeoutMs, 'zero or more'],
      ]

export const checkedPolicy = <P extends RetryPolicy | PollPolicy>(policy: P): P => {
  const refused = fieldsOf(policy).find(field => !isUsable(field))
  if (refused !== undefined) throw new InvalidPolicyError(refused[0], refused[1] ?? Number.NaN, refused[2])
  return policy
}
