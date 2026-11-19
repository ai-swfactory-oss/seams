import { describe, expect, it } from 'vitest'

import { createMemoryClock, InvalidDurationError } from '../src/memory/index'

const start = 1_767_225_600_000

describe('the memory clock', () => {
  it('reads the instant it starts at, and reading it again does not move it', () => {
    const clock = createMemoryClock({ now: start })

    expect([clock.now(), clock.now(), clock.now()]).toEqual([start, start, start])
  })

  it('moves forward by exactly each wait, one wait after another', async () => {
    const clock = createMemoryClock({ now: start })
    const seen = [clock.now()]

    await clock.wait(250)
    seen.push(clock.now())
    await clock.wait(0)
    seen.push(clock.now())
    await clock.wait(60_000)
    seen.push(clock.now())

    expect(seen).toEqual([start, start + 250, start + 250, start + 60_250])
  })

  it('refuses a negative or non-finite wait and stays where it was', async () => {
    const clock = createMemoryClock({ now: start })
    await clock.wait(10)

    const refusals = await Promise.all(
      [-1, Number.NaN, Number.POSITIVE_INFINITY].map(duration =>
        clock.wait(duration).then(
          () => 'resolved',
          (error: unknown) => error instanceof InvalidDurationError,
        ),
      ),
    )

    expect([refusals, clock.now()]).toEqual([[true, true, true], start + 10])
  })
})
