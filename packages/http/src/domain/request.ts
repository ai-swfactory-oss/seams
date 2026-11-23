import type { HttpFailure } from '../types'

export interface HttpRequestFields {
  readonly body?: unknown
  readonly timeLimitMs?: unknown
}

const isTimeLimit = (value: unknown): boolean => typeof value === 'number' && Number.isInteger(value) && value >= 0

export const missingRequestFieldOf = (request: HttpRequestFields): HttpFailure | undefined => {
  if (!(request.body instanceof Uint8Array)) {
    return {
      kind: 'failure',
      reason: 'missing-body',
      message: 'the request carries no `body`; every request carries one, and an empty body means no body',
    }
  }
  if (!isTimeLimit(request.timeLimitMs)) {
    return {
      kind: 'failure',
      reason: 'missing-time-limit',
      message: 'the request carries no `timeLimitMs`; every request carries a time limit in whole milliseconds',
    }
  }
  return undefined
}
