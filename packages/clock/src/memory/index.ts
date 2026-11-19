import { advance } from '../domain/duration'
import type { Clock, ClockState, Duration } from '../types'

export type MemoryClock = Clock & {
  readonly state: () => ClockState
}

export const createMemoryClock = (initial: ClockState): MemoryClock => {
  let current: ClockState = { now: initial.now }
  return {
    now: () => current.now,
    wait: (duration: Duration) =>
      new Promise<void>(resolve => {
        current = advance(current, duration)
        resolve()
      }),
    state: () => ({ now: current.now }),
  }
}
