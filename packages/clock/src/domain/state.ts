import type { ClockState } from '../types'

export class InvalidClockStateError extends Error {
  override readonly name = 'InvalidClockStateError'

  constructor() {
    super('A clock state is an object whose `now` is a finite number of milliseconds since the Unix epoch.')
  }
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const parseClockState = (value: unknown): ClockState => {
  if (!isRecord(value)) throw new InvalidClockStateError()
  const now = value.now
  if (typeof now !== 'number' || !Number.isFinite(now)) throw new InvalidClockStateError()
  return { now }
}
