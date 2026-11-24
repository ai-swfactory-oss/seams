import { describe, expect, it } from 'vitest'

import { NODE_EXCHANGES_READING, outcomeOf } from './node-exchanges'

describe('the node http adapter, answering', () => {
  it("the node adapter answers the response's status, headers and body", () => {
    expect(NODE_EXCHANGES_READING.kind).toBe('cases')
    expect(outcomeOf('a response answered as received')).toEqual({
      kind: 'response',
      status: 201,
      headers: [
        ['connection', 'close'],
        ['content-length', '5'],
        ['content-type', 'text/plain'],
        ['x-answer', '42'],
      ],
      body: 'aGVsbG8=',
    })
  })
})
