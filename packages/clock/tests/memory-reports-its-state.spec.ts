import { describe, expect, it } from 'vitest'

import { InvalidClockStateError, parseClockState } from '../src/index'
import { createMemoryClock } from '../src/memory/index'

const start = 1_767_225_600_000

describe('the memory clock state', () => {
  it('is, before any wait, the state the clock was built from', () => {
    expect(createMemoryClock({ now: start }).state()).toEqual({ now: start })
  })

  it('reports the instant the waits reached, in the state type it was built from', async () => {
    const clock = createMemoryClock({ now: start })
    await clock.wait(1_500)
    await clock.wait(500)

    expect(clock.state()).toEqual({ now: start + 2_000 })
  })

  it('survives JSON: a clock built from the reported state, sent through JSON, resumes where the first one stopped', async () => {
    const first = createMemoryClock({ now: start })
    await first.wait(42)

    const resumed = createMemoryClock(parseClockState(JSON.parse(JSON.stringify(first.state()))))
    await resumed.wait(8)

    expect([first.now(), resumed.now(), resumed.state()]).toEqual([start + 42, start + 50, { now: start + 50 }])
  })

  it('is refused when it is not a state, so a clock is never built from one', () => {
    const refused = [null, [], {}, { now: '0' }, { now: Number.NaN }].map(value => {
      try {
        parseClockState(value)
        return 'parsed'
      } catch (error) {
        return error instanceof InvalidClockStateError
      }
    })

    expect(refused).toEqual([true, true, true, true, true])
  })
})
