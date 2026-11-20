import { advance, isDuration } from '../domain/duration'
import type { Clock, ClockState, Duration } from '../index'

export class InvalidDurationError extends Error {
  override readonly name = 'InvalidDurationError'

  constructor(readonly duration: number) {
    super(`A duration is a finite number of milliseconds, zero or more; got ${String(duration)}.`)
  }
}

export interface MemoryClock extends Clock {
  readonly state: () => ClockState
}

export const createMemoryClock = (initial: ClockState): MemoryClock => {
  let current: ClockState = { now: initial.now }
  return {
    now: () => current.now,
    wait: (duration: Duration) =>
      new Promise<void>((resolve, reject) => {
        if (!isDuration(duration)) {
          reject(new InvalidDurationError(duration))
          return
        }
        current = advance(current, duration)
        resolve()
      }),
    state: () => ({ now: current.now }),
  }
}
