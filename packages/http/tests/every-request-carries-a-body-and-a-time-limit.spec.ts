import { describe, expect, expectTypeOf, it } from 'vitest'

import { generateHttpExchanges } from '../src/generate/index'
import type { HttpRequest, HttpRequestJson, HttpState } from '../src/index'
import { missingRequestFieldOf, requestToJson } from '../src/index'
import { createMemoryHttp } from '../src/memory/index'

const LIMIT = 2_500

const EMPTY: HttpRequest = { method: 'GET', url: 'https://api.example/empty', headers: [], body: new Uint8Array(), timeLimitMs: LIMIT }

const STATE: HttpState = {
  exchanges: [
    {
      request: { method: 'GET', url: 'https://api.example/empty', headers: [], body: '', timeLimitMs: LIMIT },
      outcome: { kind: 'response', status: 204, headers: [], body: '' },
    },
  ],
}

describe('every request carries a body and a time limit', () => {
  it('requires the body and the time limit of a request and of its recorded form, so a request built without either does not type-check', () => {
    expectTypeOf<Pick<HttpRequest, 'body' | 'timeLimitMs'>>().toEqualTypeOf<{ readonly body: Uint8Array; readonly timeLimitMs: number }>()
    expectTypeOf<Pick<HttpRequestJson, 'body' | 'timeLimitMs'>>().toEqualTypeOf<{ readonly body: string; readonly timeLimitMs: number }>()
  })

  it.each([
    { lacking: 'its body', request: { timeLimitMs: LIMIT }, reason: 'missing-body', field: '`body`' },
    { lacking: 'its time limit', request: { body: new Uint8Array() }, reason: 'missing-time-limit', field: '`timeLimitMs`' },
    {
      lacking: 'a whole time limit',
      request: { body: new Uint8Array(), timeLimitMs: 1.5 },
      reason: 'missing-time-limit',
      field: '`timeLimitMs`',
    },
  ])('answers a request that reaches the port without $lacking as a typed failure naming the field', ({ request, reason, field }) => {
    const failure = missingRequestFieldOf(request)

    expect({ kind: failure?.kind, reason: failure?.reason, names: failure?.message.includes(field) }).toEqual({
      kind: 'failure',
      reason,
      names: true,
    })
  })

  it('finds nothing missing in a request that carries both, an empty body included', () => {
    expect(missingRequestFieldOf(EMPTY)).toBeUndefined()
  })

  it('sends and replays a request whose body is empty as a request with no body', async () => {
    const http = createMemoryHttp(STATE)

    expect([requestToJson(EMPTY).body, (await http.send(EMPTY)).kind, http.state()]).toEqual(['', 'response', { exchanges: [] }])
  })

  it('generates state that records the body and the time limit of every request', async () => {
    const generated = await generateHttpExchanges(
      { requests: STATE.exchanges.map(({ request }) => request) },
      { ports: { http: createMemoryHttp(STATE) } },
    )

    expect(generated.exchanges.map(({ request }) => [request.body, request.timeLimitMs])).toEqual([['', LIMIT]])
  })
})
