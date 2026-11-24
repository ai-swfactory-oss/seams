import { describe, expect, it } from 'vitest'

import { durationRefusal, InvalidDurationError } from '../src/domain/duration'

describe('a duration is refused unless it is finite and not negative', () => {
  it('a negative, NaN or infinite duration is refused with InvalidDurationError and a finite duration of zero or more passes', () => {
    const refused = [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].map(durationRefusal)
    const passed = [0, 5, 2_147_483_648].map(durationRefusal)

    expect([refused.map(refusal => refusal instanceof InvalidDurationError && refusal.duration), passed]).toEqual([
      [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
      [null, null, null],
    ])
  })
})
