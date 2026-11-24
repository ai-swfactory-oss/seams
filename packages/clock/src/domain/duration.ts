import type { ClockState, Duration } from '../types'

export class InvalidDurationError extends Error {
  override readonly name = 'InvalidDurationError'

  constructor(readonly duration: number) {
    super(`A duration is a finite number of milliseconds, zero or more; got ${String(duration)}.`)
  }
}

export const durationRefusal = (duration: Duration): InvalidDurationError | null =>
  Number.isFinite(duration) && duration >= 0 ? null : new InvalidDurationError(duration)

export const advance = (state: ClockState, duration: Duration): ClockState => ({
  now: state.now + duration,
})
