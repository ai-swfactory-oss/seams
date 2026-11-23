import { describe, expect, it } from 'vitest'

import type { HttpRequest, HttpState } from '../src/index'
import { createMemoryHttp, UnmatchedHttpRequestError } from '../src/memory/index'

const text = (value: string): Uint8Array => new TextEncoder().encode(value)

const LIMIT = 5_000

const get: HttpRequest = {
  method: 'GET',
  url: 'https://api.example/items',
  headers: [['authorization', 'token REF']],
  body: new Uint8Array(),
  timeLimitMs: LIMIT,
}
const post: HttpRequest = {
  method: 'POST',
  url: 'https://api.example/items',
  headers: [['content-type', 'application/json']],
  body: text('{"a":1}'),
  timeLimitMs: LIMIT,
}

const STATE: HttpState = {
  exchanges: [
    {
      request: { method: 'GET', url: 'https://api.example/items', headers: [['authorization', 'token REF']], body: '', timeLimitMs: LIMIT },
      outcome: { kind: 'response', status: 200, headers: [['content-type', 'application/json']], body: 'W10=' },
    },
    {
      request: {
        method: 'POST',
        url: 'https://api.example/items',
        headers: [['content-type', 'application/json']],
        body: 'eyJhIjoxfQ==',
        timeLimitMs: LIMIT,
      },
      outcome: { kind: 'response', status: 422, headers: [], body: '' },
    },
  ],
}

describe('the memory http adapter', () => {
  it('answers each request with the next exchange, in order, decoding its body', async () => {
    const http = createMemoryHttp(STATE)

    const outcomes = [await http.send(get), await http.send(post)]

    expect(outcomes).toEqual([
      { kind: 'response', status: 200, headers: [['content-type', 'application/json']], body: text('[]') },
      { kind: 'response', status: 422, headers: [], body: new Uint8Array() },
    ])
  })

  it('replays an exchange only to a request with the same time limit, and consumes nothing otherwise', async () => {
    const http = createMemoryHttp(STATE)

    await expect(http.send({ ...get, timeLimitMs: LIMIT + 1 })).rejects.toBeInstanceOf(UnmatchedHttpRequestError)
    expect(http.state()).toEqual(STATE)
  })

  it('throws the named error for a request out of order, and consumes nothing', async () => {
    const http = createMemoryHttp(STATE)

    await expect(http.send(post)).rejects.toBeInstanceOf(UnmatchedHttpRequestError)
    expect(http.state()).toEqual(STATE)
  })

  it('throws the named error for a header that differs, in value or in order', async () => {
    const http = createMemoryHttp(STATE)

    await expect(http.send({ ...get, headers: [['authorization', 'token OTHER']] })).rejects.toBeInstanceOf(UnmatchedHttpRequestError)
  })

  it('replays an exchange only to a request with the same body, and throws the named error for a method that differs', async () => {
    const http = createMemoryHttp({ exchanges: STATE.exchanges.slice(1) })

    await expect(http.send({ ...post, body: text('{"a":2}') })).rejects.toBeInstanceOf(UnmatchedHttpRequestError)
    await expect(http.send({ ...post, method: 'PUT' })).rejects.toBeInstanceOf(UnmatchedHttpRequestError)
  })

  it('records an empty body as no body, and replays it only to a request whose body is empty', async () => {
    const http = createMemoryHttp(STATE)

    await expect(http.send({ ...get, body: text('x') })).rejects.toBeInstanceOf(UnmatchedHttpRequestError)
    expect([STATE.exchanges[0]?.request.body, (await http.send(get)).kind]).toEqual(['', 'response'])
  })

  it('throws the named error once no exchange is left', async () => {
    const http = createMemoryHttp({ exchanges: [] })

    await expect(http.send(get)).rejects.toBeInstanceOf(UnmatchedHttpRequestError)
  })
})
