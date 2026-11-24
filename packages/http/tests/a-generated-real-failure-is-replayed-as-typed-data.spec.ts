import { describe, expect, it } from 'vitest'

import { requestFromJson } from '../src/index'
import { createMemoryHttp } from '../src/memory/index'
import { failureShapeOf, NODE_EXCHANGES_READING, nodeExchange } from './node-exchanges'

describe('a generated real failure, replayed', () => {
  it('a real network failure recorded by the generator is replayed by the memory adapter as the same typed HttpFailure', async () => {
    const recorded = nodeExchange('a request to a refused port')
    const [exchange] = recorded?.state.exchanges ?? []
    const http = createMemoryHttp({ exchanges: recorded?.state.exchanges ?? [] })

    const replayed = exchange === undefined ? undefined : await http.send(requestFromJson(exchange.request))

    expect(NODE_EXCHANGES_READING.kind).toBe('cases')
    expect(failureShapeOf(exchange?.outcome)).toEqual({ kind: 'failure', reason: 'refused', message: 'string' })
    expect([replayed, http.state().exchanges]).toEqual([exchange?.outcome, []])
  })
})
