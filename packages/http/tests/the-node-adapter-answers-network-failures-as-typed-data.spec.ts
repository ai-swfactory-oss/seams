import { describe, expect, it } from 'vitest'

import { failureShapeOf, NODE_EXCHANGES_READING, outcomeOf } from './node-exchanges'

describe('the node http adapter, network failures', () => {
  it('a request to an unresolvable host answers a dns failure and nothing is thrown', () => {
    expect(NODE_EXCHANGES_READING.kind).toBe('cases')
    expect(failureShapeOf(outcomeOf('a request to an unresolvable host'))).toEqual({ kind: 'failure', reason: 'dns', message: 'string' })
  })

  it('a request to a refused port answers a refused failure and nothing is thrown', () => {
    expect(NODE_EXCHANGES_READING.kind).toBe('cases')
    expect(failureShapeOf(outcomeOf('a request to a refused port'))).toEqual({ kind: 'failure', reason: 'refused', message: 'string' })
  })

  it('a request whose tls handshake fails answers a tls failure and nothing is thrown', () => {
    expect(NODE_EXCHANGES_READING.kind).toBe('cases')
    expect(failureShapeOf(outcomeOf('a request whose tls handshake fails'))).toEqual({ kind: 'failure', reason: 'tls', message: 'string' })
  })
})
