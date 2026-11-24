import { describe, expect, it } from 'vitest'

import { NODE_EXCHANGES_READING, nodeExchange } from './node-exchanges'

describe('the node http adapter, redirects', () => {
  it('a redirect response is answered as that response and no redirect is followed', () => {
    const recorded = nodeExchange('a redirect answered as that response')

    expect(NODE_EXCHANGES_READING.kind).toBe('cases')
    expect([recorded?.received.map(received => received.url), recorded?.state.exchanges[0]?.outcome]).toEqual([
      ['/from'],
      {
        kind: 'response',
        status: 302,
        headers: [
          ['connection', 'close'],
          ['content-length', '0'],
          ['location', '/elsewhere'],
        ],
        body: '',
      },
    ])
  })
})
