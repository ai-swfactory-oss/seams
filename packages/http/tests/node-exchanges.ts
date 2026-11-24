import { type HttpHeaders, type HttpOutcomeJson, type HttpRequestJson, type HttpState, parseHttpState } from '../src/index'
import generated from './generated/node-exchanges.json'

interface Received {
  readonly method: string
  readonly url: string
  readonly headers: HttpHeaders
  readonly body: string
}

interface NodeExchangeCase {
  readonly name: string
  readonly state: HttpState
  readonly received: readonly Received[]
}

type NodeExchangesReading =
  | { readonly kind: 'cases'; readonly cases: readonly NodeExchangeCase[] }
  | { readonly kind: 'malformed'; readonly index: number }

const headersOf = (value: unknown): HttpHeaders | undefined => {
  if (!Array.isArray(value)) return undefined
  const pairs: (readonly [string, string])[] = []
  for (const pair of value) {
    if (!Array.isArray(pair) || pair.length !== 2) return undefined
    const name: unknown = pair[0]
    const text: unknown = pair[1]
    if (typeof name !== 'string' || typeof text !== 'string') return undefined
    pairs.push([name, text])
  }
  return pairs
}

const receivedOf = (value: unknown): Received | undefined => {
  if (typeof value !== 'object' || value === null) return undefined
  if (!('method' in value) || !('url' in value) || !('headers' in value) || !('body' in value)) return undefined
  const { method, url, body } = value
  const headers = headersOf(value.headers)
  if (typeof method !== 'string' || typeof url !== 'string' || typeof body !== 'string' || headers === undefined) return undefined
  return { method, url, headers, body }
}

const receivedListOf = (value: unknown): Received[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const list: Received[] = []
  for (const item of value) {
    const received = receivedOf(item)
    if (received === undefined) return undefined
    list.push(received)
  }
  return list
}

const caseOf = (value: unknown): NodeExchangeCase | undefined => {
  if (typeof value !== 'object' || value === null || !('name' in value) || !('state' in value) || !('received' in value)) {
    return undefined
  }
  const { name } = value
  const state = parseHttpState(value.state)
  const received = receivedListOf(value.received)
  return typeof name !== 'string' || state === undefined || received === undefined ? undefined : { name, state, received }
}

const readNodeExchanges = (values: readonly unknown[]): NodeExchangesReading => {
  const cases: NodeExchangeCase[] = []
  for (const [index, value] of values.entries()) {
    const found = caseOf(value)
    if (found === undefined) return { kind: 'malformed', index }
    cases.push(found)
  }
  return { kind: 'cases', cases }
}

export const NODE_EXCHANGES_READING: NodeExchangesReading = readNodeExchanges(generated.cases)

const NODE_EXCHANGES: readonly NodeExchangeCase[] = NODE_EXCHANGES_READING.kind === 'cases' ? NODE_EXCHANGES_READING.cases : []

export const nodeExchange = (name: string): NodeExchangeCase | undefined => NODE_EXCHANGES.find(entry => entry.name === name)

export const requestOf = (name: string): HttpRequestJson | undefined => nodeExchange(name)?.state.exchanges[0]?.request

export const outcomeOf = (name: string): HttpOutcomeJson | undefined => nodeExchange(name)?.state.exchanges[0]?.outcome

export const failureShapeOf = (outcome: HttpOutcomeJson | undefined): unknown =>
  outcome?.kind === 'failure' ? { kind: outcome.kind, reason: outcome.reason, message: typeof outcome.message } : outcome

export const PLATFORM_ADDED_HEADERS: readonly string[] = [
  'accept',
  'accept-encoding',
  'accept-language',
  'connection',
  'content-length',
  'host',
  'sec-fetch-mode',
  'user-agent',
]
