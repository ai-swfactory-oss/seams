import { advance, durationRefusal } from '../domain/duration'
import type { Clock, ClockState, Duration } from '../index'

export { InvalidDurationError } from '../domain/duration'

export interface MemoryClock extends Clock {
  readonly state: () => ClockState
}

export const createMemoryClock = (initial: ClockState): MemoryClock => {
  let current: ClockState = { now: initial.now }
  return {
    now: () => current.now,
    wait: (duration: Duration) =>
      new Promise<void>((resolve, reject) => {
        const refusal = durationRefusal(duration)
        if (refusal !== null) {
          reject(refusal)
          return
        }
        current = advance(current, duration)
        resolve()
      }),
    state: () => ({ now: current.now }),
  }
}
