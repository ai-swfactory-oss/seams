import { describe, expect, it } from 'vitest'

import { parseClockState } from '../src/index'
import generated from './generated/standard-results.json'

describe("the standard clock's generated wait never goes back", () => {
  it("the standard clock's generated wait reads an instant after the wait that is not before the instant before it", () => {
    const before = parseClockState(generated.wait.before)
    const after = parseClockState(generated.wait.after)

    expect([before !== undefined, after !== undefined, (after?.now ?? 0) >= (before?.now ?? Number.POSITIVE_INFINITY)]).toEqual([
      true,
      true,
      true,
    ])
  })
})
