export type HttpHeaders = readonly (readonly [name: string, value: string])[]

export interface HttpRequest {
  readonly method: string
  readonly url: string
  readonly headers: HttpHeaders
  readonly body?: Uint8Array

  readonly timeLimitMs?: number
}

export interface HttpResponse {
  readonly kind: 'response'
  readonly status: number
  readonly headers: HttpHeaders
  readonly body: Uint8Array
}

export type HttpFailureReason = 'dns' | 'refused' | 'reset' | 'tls' | 'timed-out' | 'other'

export interface HttpFailure {
  readonly kind: 'failure'
  readonly reason: HttpFailureReason
  readonly message: string
}

export type HttpOutcome = HttpResponse | HttpFailure

export interface Http {
  readonly send: (request: HttpRequest) => Promise<HttpOutcome>
}

export interface HttpRequestJson {
  readonly method: string
  readonly url: string
  readonly headers: HttpHeaders
  readonly body?: string
  readonly timeLimitMs?: number
}

export type HttpOutcomeJson = (Omit<HttpResponse, 'body'> & { readonly body: string }) | HttpFailure

export interface HttpExchangeJson {
  readonly request: HttpRequestJson
  readonly outcome: HttpOutcomeJson
}

export interface HttpState {
  readonly exchanges: readonly HttpExchangeJson[]
}
