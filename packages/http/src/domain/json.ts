import { decodeBase64, encodeBase64 } from '@ai-swfactory-oss/bytes'

import type {
  HttpExchangeJson,
  HttpFailureReason,
  HttpHeaders,
  HttpOutcome,
  HttpOutcomeJson,
  HttpRequest,
  HttpRequestJson,
  HttpState,
} from '../types'

export const requestToJson = (request: HttpRequest): HttpRequestJson => ({
  method: request.method,
  url: request.url,
  headers: request.headers,
  ...(request.body === undefined ? {} : { body: encodeBase64(request.body) }),
  ...(request.timeLimitMs === undefined ? {} : { timeLimitMs: request.timeLimitMs }),
})

export const requestFromJson = (json: HttpRequestJson): HttpRequest => ({
  method: json.method,
  url: json.url,
  headers: json.headers,
  ...(json.body === undefined ? {} : { body: decodeBase64(json.body) }),
  ...(json.timeLimitMs === undefined ? {} : { timeLimitMs: json.timeLimitMs }),
})

export const outcomeToJson = (outcome: HttpOutcome): HttpOutcomeJson =>
  outcome.kind === 'failure' ? outcome : { ...outcome, body: encodeBase64(outcome.body) }

export const outcomeFromJson = (json: HttpOutcomeJson): HttpOutcome =>
  json.kind === 'failure' ? json : { ...json, body: decodeBase64(json.body) }

const REASONS: readonly HttpFailureReason[] = ['dns', 'refused', 'reset', 'tls', 'timed-out', 'other']

const reasonOf = (value: unknown): HttpFailureReason | undefined => REASONS.find(reason => reason === value)

const isList = (value: unknown): value is readonly unknown[] => Array.isArray(value)

const isBase64 = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    decodeBase64(value)
    return true
  } catch {
    return false
  }
}

const isStatus = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 100 && value <= 599

const isTimeLimit = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0

const headersOf = (value: unknown): HttpHeaders | undefined => {
  if (!isList(value)) return undefined
  const pairs: (readonly [string, string])[] = []
  for (const pair of value) {
    if (!isList(pair) || pair.length !== 2) return undefined
    const [name, text] = pair
    if (typeof name !== 'string' || typeof text !== 'string') return undefined
    pairs.push([name, text])
  }
  return pairs
}

const requestJsonOf = (value: unknown): HttpRequestJson | undefined => {
  if (typeof value !== 'object' || value === null) return undefined
  if (!('method' in value) || !('url' in value) || !('headers' in value)) return undefined
  const { method, url } = value
  const headers = headersOf(value.headers)
  if (typeof method !== 'string' || typeof url !== 'string' || headers === undefined) return undefined
  const body = 'body' in value ? value.body : undefined
  const timeLimitMs = 'timeLimitMs' in value ? value.timeLimitMs : undefined
  if (body !== undefined && !isBase64(body)) return undefined
  if (timeLimitMs !== undefined && !isTimeLimit(timeLimitMs)) return undefined
  return {
    method,
    url,
    headers,
    ...(body === undefined ? {} : { body }),
    ...(timeLimitMs === undefined ? {} : { timeLimitMs }),
  }
}

const outcomeJsonOf = (value: unknown): HttpOutcomeJson | undefined => {
  if (typeof value !== 'object' || value === null || !('kind' in value)) return undefined
  if (value.kind === 'failure') {
    if (!('reason' in value) || !('message' in value) || typeof value.message !== 'string') return undefined
    const reason = reasonOf(value.reason)
    return reason === undefined ? undefined : { kind: 'failure', reason, message: value.message }
  }
  if (value.kind !== 'response' || !('status' in value) || !('headers' in value) || !('body' in value)) return undefined
  const { status, body } = value
  const headers = headersOf(value.headers)
  if (!isStatus(status) || !isBase64(body) || headers === undefined) return undefined
  return { kind: 'response', status, headers, body }
}

const exchangeJsonOf = (value: unknown): HttpExchangeJson | undefined => {
  if (typeof value !== 'object' || value === null || !('request' in value) || !('outcome' in value)) return undefined
  const request = requestJsonOf(value.request)
  const outcome = outcomeJsonOf(value.outcome)
  return request === undefined || outcome === undefined ? undefined : { request, outcome }
}

export const parseHttpState = (value: unknown): HttpState | undefined => {
  if (typeof value !== 'object' || value === null || !('exchanges' in value) || !Array.isArray(value.exchanges)) return undefined
  const exchanges: HttpExchangeJson[] = []
  for (const raw of value.exchanges) {
    const exchange = exchangeJsonOf(raw)
    if (exchange === undefined) return undefined
    exchanges.push(exchange)
  }
  return { exchanges }
}
