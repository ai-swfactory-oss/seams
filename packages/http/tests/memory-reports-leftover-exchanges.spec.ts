import { describe, expect, it } from 'vitest'

import { type HttpExchangeJson, type HttpState, parseHttpState } from '../src/index'
import { createMemoryHttp } from '../src/memory/index'

const STATE: HttpState = {
  exchanges: [
    {
      request: { method: 'GET', url: 'https://api.example/a', headers: [] },
      outcome: { kind: 'response', status: 200, headers: [], body: '' },
    },
    {
      request: { method: 'GET', url: 'https://api.example/b', headers: [] },
      outcome: { kind: 'failure', reason: 'reset', message: 'socket hang up' },
    },
  ],
}

describe('the memory http state', () => {
  it('reports every exchange as leftover before any request', () => {
    expect(createMemoryHttp(STATE).state()).toEqual(STATE)
  })

  it('reports only the exchanges not used yet', async () => {
    const http = createMemoryHttp(STATE)

    await http.send({ method: 'GET', url: 'https://api.example/a', headers: [] })

    expect(http.state()).toEqual({ exchanges: [STATE.exchanges[1]] })
  })

  it('reports no leftover once every exchange is used, and a failure is answered as data', async () => {
    const http = createMemoryHttp(STATE)

    await http.send({ method: 'GET', url: 'https://api.example/a', headers: [] })
    const failure = await http.send({ method: 'GET', url: 'https://api.example/b', headers: [] })

    expect([failure, http.state()]).toEqual([{ kind: 'failure', reason: 'reset', message: 'socket hang up' }, { exchanges: [] }])
  })

  it('reports a state that survives a JSON round trip', async () => {
    const http = createMemoryHttp(STATE)
    await http.send({ method: 'GET', url: 'https://api.example/a', headers: [] })

    expect(parseHttpState(JSON.parse(JSON.stringify(http.state())))).toEqual(http.state())
  })

  it('reports a leftover that a later change to the state it was built from does not reach', () => {
    const exchanges: HttpExchangeJson[] = [...STATE.exchanges]
    const http = createMemoryHttp({ exchanges })

    exchanges.splice(0)

    expect(http.state()).toEqual(STATE)
  })

  it('reads no state from a body that is not base64 or a status that is not one', () => {
    const response = (status: number, body: string): unknown => ({
      exchanges: [
        { request: { method: 'GET', url: 'https://api.example/a', headers: [] }, outcome: { kind: 'response', status, headers: [], body } },
      ],
    })

    expect([parseHttpState(response(200, '%%')), parseHttpState(response(1.5, '')), parseHttpState(response(200, ''))]).toEqual([
      undefined,
      undefined,
      {
        exchanges: [
          {
            request: { method: 'GET', url: 'https://api.example/a', headers: [] },
            outcome: { kind: 'response', status: 200, headers: [], body: '' },
          },
        ],
      },
    ])
  })
})
