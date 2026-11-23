import { describe, expect, it } from 'vitest'

import { type HttpExchangeJson, type HttpRequest, type HttpRequestJson, type HttpState, parseHttpState } from '../src/index'
import { createMemoryHttp } from '../src/memory/index'

const LIMIT = 5_000

const recorded = (path: string): HttpRequestJson => ({
  method: 'GET',
  url: `https://api.example/${path}`,
  headers: [],
  body: '',
  timeLimitMs: LIMIT,
})

const sent = (path: string): HttpRequest => ({
  method: 'GET',
  url: `https://api.example/${path}`,
  headers: [],
  body: new Uint8Array(),
  timeLimitMs: LIMIT,
})

const STATE: HttpState = {
  exchanges: [
    { request: recorded('a'), outcome: { kind: 'response', status: 200, headers: [], body: '' } },
    { request: recorded('b'), outcome: { kind: 'failure', reason: 'reset', message: 'socket hang up' } },
  ],
}

describe('the memory http state', () => {
  it('reports every exchange as leftover before any request', () => {
    expect(createMemoryHttp(STATE).state()).toEqual(STATE)
  })

  it('reports only the exchanges not used yet', async () => {
    const http = createMemoryHttp(STATE)

    await http.send(sent('a'))

    expect(http.state()).toEqual({ exchanges: [STATE.exchanges[1]] })
  })

  it('reports no leftover once every exchange is used, and a failure is answered as data', async () => {
    const http = createMemoryHttp(STATE)

    await http.send(sent('a'))
    const failure = await http.send(sent('b'))

    expect([failure, http.state()]).toEqual([{ kind: 'failure', reason: 'reset', message: 'socket hang up' }, { exchanges: [] }])
  })

  it('reports a state that survives a JSON round trip, recording the body and the time limit of every request', async () => {
    const http = createMemoryHttp(STATE)
    await http.send(sent('a'))

    const state = parseHttpState(JSON.parse(JSON.stringify(http.state())))

    expect([state, state?.exchanges.map(({ request }) => [request.body, request.timeLimitMs])]).toEqual([http.state(), [['', LIMIT]]])
  })

  it('reports a leftover that a later change to the state it was built from does not reach', () => {
    const exchanges: HttpExchangeJson[] = [...STATE.exchanges]
    const http = createMemoryHttp({ exchanges })

    exchanges.splice(0)

    expect(http.state()).toEqual(STATE)
  })

  it('reads no state from a body that is not base64 or a status that is not one', () => {
    const response = (status: number, body: string): unknown => ({
      exchanges: [{ request: recorded('a'), outcome: { kind: 'response', status, headers: [], body } }],
    })

    expect([parseHttpState(response(200, '%%')), parseHttpState(response(1.5, '')), parseHttpState(response(200, ''))]).toEqual([
      undefined,
      undefined,
      { exchanges: [{ request: recorded('a'), outcome: { kind: 'response', status: 200, headers: [], body: '' } }] },
    ])
  })

  it('refuses as data a generated exchange whose request lacks its body or its time limit', () => {
    const lacking = (request: unknown): unknown => ({
      exchanges: [{ request, outcome: { kind: 'response', status: 200, headers: [], body: '' } }],
    })

    expect([
      parseHttpState(lacking({ method: 'GET', url: 'https://api.example/a', headers: [], timeLimitMs: LIMIT })),
      parseHttpState(lacking({ method: 'GET', url: 'https://api.example/a', headers: [], body: '' })),
    ]).toEqual([undefined, undefined])
  })
})
