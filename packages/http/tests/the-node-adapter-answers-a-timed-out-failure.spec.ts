import { describe, expect, it } from 'vitest'

import { failureShapeOf, NODE_EXCHANGES_READING, outcomeOf, requestOf } from './node-exchanges'

describe('the node http adapter, time limits', () => {
  it('a request that outlives its time limit answers a timed-out failure', () => {
    const name = 'a request that outlives its time limit'

    expect(NODE_EXCHANGES_READING.kind).toBe('cases')
    expect([requestOf(name)?.timeLimitMs, failureShapeOf(outcomeOf(name))]).toEqual([
      200,
      { kind: 'failure', reason: 'timed-out', message: 'string' },
    ])
  })
})
