import type { ClockState, Duration } from '../types'

export const isDuration = (duration: Duration): boolean => Number.isFinite(duration) && duration >= 0

export const advance = (state: ClockState, duration: Duration): ClockState => ({
  now: state.now + duration,
})
