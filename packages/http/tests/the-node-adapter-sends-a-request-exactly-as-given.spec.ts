import { describe, expect, it } from 'vitest'

import { NODE_EXCHANGES_READING, nodeExchange, PLATFORM_ADDED_HEADERS } from './node-exchanges'

describe('the node http adapter, sending', () => {
  it('the node adapter sends a request with exactly its method, url, headers and body', () => {
    const recorded = nodeExchange('a request sent exactly as given')
    const [received] = recorded?.received ?? []
    const given = received?.headers.filter(([name]) => !PLATFORM_ADDED_HEADERS.includes(name))

    expect(NODE_EXCHANGES_READING.kind).toBe('cases')
    expect(recorded?.received).toHaveLength(1)
    expect([received?.method, received?.url, given, received?.body]).toEqual([
      'POST',
      '/items?q=1',
      [
        ['content-type', 'application/json'],
        ['x-trace', 'abc'],
      ],
      'eyJhIjoxfQ==',
    ])
  })
})
