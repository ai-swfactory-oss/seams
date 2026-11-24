import { describe, expect, it } from 'vitest'

import { PIPE_RESULTS_READING } from './node-results'

describe('the node adapter reads the lines of a named pipe', () => {
  it("the node adapter's readLines yields each line written to a named pipe in order", () => {
    expect(PIPE_RESULTS_READING.kind === 'pipe' ? PIPE_RESULTS_READING.pipe.reading : PIPE_RESULTS_READING).toStrictEqual({
      written: [{ kind: 'written' }, { kind: 'written' }],
      lines: ['first', 'second', 'third'],
      ended: true,
    })
  })
})
