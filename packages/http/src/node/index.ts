import { missingRequestFieldOf } from '../domain/request'
import type { Http, HttpFailure, HttpFailureReason, HttpOutcome, HttpRequest } from '../types'

const DNS = new Set(['ENOTFOUND', 'EAI_AGAIN', 'EAI_NONAME', 'EAI_FAIL'])
const REFUSED = new Set(['ECONNREFUSED'])
const RESET = new Set(['ECONNRESET', 'EPIPE', 'UND_ERR_SOCKET', 'UND_ERR_CLOSED'])
const TIMED_OUT = new Set(['ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT'])
const TLS = new Set([
  'EPROTO',
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
])

const fieldOf = (value: unknown, name: string): unknown =>
  typeof value === 'object' && value !== null ? Reflect.get(value, name) : undefined

const textOf = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

const reasonOfCode = (code: string | undefined): HttpFailureReason => {
  if (code === undefined) return 'other'
  if (DNS.has(code)) return 'dns'
  if (REFUSED.has(code)) return 'refused'
  if (RESET.has(code)) return 'reset'
  if (TIMED_OUT.has(code)) return 'timed-out'
  if (TLS.has(code) || code.startsWith('ERR_SSL_') || code.startsWith('ERR_TLS_')) return 'tls'
  return 'other'
}

const failureOf = (error: unknown): HttpFailure => {
  const name = textOf(fieldOf(error, 'name'))
  const message = textOf(fieldOf(error, 'message')) ?? String(error)
  if (name === 'TimeoutError' || name === 'AbortError') return { kind: 'failure', reason: 'timed-out', message }
  const cause = fieldOf(error, 'cause')
  const code = textOf(fieldOf(cause, 'code')) ?? textOf(fieldOf(error, 'code'))
  const detail = textOf(fieldOf(cause, 'message'))
  return { kind: 'failure', reason: reasonOfCode(code), message: detail === undefined ? message : `${message}: ${detail}` }
}

const exchange = async (request: HttpRequest): Promise<HttpOutcome> => {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers.map(([name, value]): [string, string] => [name, value]),
    ...(request.body.length === 0 ? {} : { body: request.body }),
    redirect: 'manual',
    signal: AbortSignal.timeout(request.timeLimitMs),
  })
  const body = new Uint8Array(await response.arrayBuffer())
  return { kind: 'response', status: response.status, headers: [...response.headers], body }
}

const send = async (request: HttpRequest): Promise<HttpOutcome> => {
  const missing = missingRequestFieldOf(request)
  if (missing !== undefined) return missing
  try {
    return await exchange(request)
  } catch (error: unknown) {
    return failureOf(error)
  }
}

export const createNodeHttp = (): Http => ({ send })
