import { durationRefusal } from '../domain/duration'
import type { Clock, Duration } from '../index'

export { InvalidDurationError } from '../domain/duration'

const LONGEST_TIMER = 2_147_483_647

const sleep = (duration: Duration): Promise<void> =>
  new Promise<void>(resolve => {
    setTimeout(resolve, Math.min(duration, LONGEST_TIMER))
  }).then(() => (duration > LONGEST_TIMER ? sleep(duration - LONGEST_TIMER) : undefined))

export const createStandardClock = (): Clock => ({
  now: () => Date.now(),
  wait: (duration: Duration) => {
    const refusal = durationRefusal(duration)
    return refusal === null ? sleep(duration) : Promise.reject(refusal)
  },
})
