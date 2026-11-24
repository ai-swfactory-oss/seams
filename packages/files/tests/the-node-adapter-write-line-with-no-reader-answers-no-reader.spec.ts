import { describe, expect, it } from 'vitest'

import { PIPE_RESULTS_READING } from './node-results'

describe('the node adapter write line with no reader answers no reader', () => {
  it("the node adapter's writeLine to a named pipe with no reader answers no-reader without blocking", () => {
    expect(PIPE_RESULTS_READING.kind === 'pipe' ? PIPE_RESULTS_READING.pipe.noReader : PIPE_RESULTS_READING).toStrictEqual({
      kind: 'no-reader',
    })
  })
})
