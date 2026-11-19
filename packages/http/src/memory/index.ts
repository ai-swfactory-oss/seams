import { outcomeFromJson, requestToJson } from '../domain/json'
import { sameRequest } from '../domain/match'
import type { Http, HttpOutcome, HttpRequest, HttpRequestJson, HttpState } from '../types'

export class UnmatchedHttpRequestError extends Error {
  constructor(
    readonly request: HttpRequestJson,
    readonly expected: HttpRequestJson | undefined,
  ) {
    super(
      expected === undefined
        ? `no exchange is left for ${request.method} ${request.url}`
        : `${request.method} ${request.url} is not the next exchange, ${expected.method} ${expected.url}`,
    )
    this.name = 'UnmatchedHttpRequestError'
  }
}

export interface MemoryHttp extends Http {
  readonly state: () => HttpState
}

export const createMemoryHttp = (initial: HttpState): MemoryHttp => {
  let exchanges = structuredClone(initial.exchanges)
  const send = (request: HttpRequest): Promise<HttpOutcome> => {
    const sent = requestToJson(request)
    const [next, ...rest] = exchanges
    if (next === undefined || !sameRequest(sent, next.request)) {
      return Promise.reject(new UnmatchedHttpRequestError(sent, next === undefined ? undefined : structuredClone(next.request)))
    }
    exchanges = rest
    return Promise.resolve(outcomeFromJson(structuredClone(next.outcome)))
  }
  return { send, state: () => ({ exchanges: structuredClone(exchanges) }) }
}
