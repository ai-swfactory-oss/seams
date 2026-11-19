import type { ClockState, Duration } from '../types'

export class InvalidDurationError extends Error {
  override readonly name = 'InvalidDurationError'

  constructor(readonly duration: number) {
    super(`A duration is a finite number of milliseconds, zero or more; got ${String(duration)}.`)
  }
}

const checkedDuration = (duration: Duration): Duration => {
  if (!Number.isFinite(duration) || duration < 0) throw new InvalidDurationError(duration)
  return duration
}

export const advance = (state: ClockState, duration: Duration): ClockState => ({
  now: state.now + checkedDuration(duration),
})
