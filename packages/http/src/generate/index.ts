import { outcomeToJson, requestFromJson } from '../domain/json'
import type { Http, HttpExchangeJson, HttpRequestJson, HttpState } from '../types'

export interface HttpGeneration {
  readonly requests: readonly HttpRequestJson[]
}

export const generateHttpExchanges = async (call: HttpGeneration, ports: { readonly http: Http }): Promise<HttpState> => {
  const exchanges: HttpExchangeJson[] = []
  for (const request of call.requests) {
    const outcome = await ports.http.send(requestFromJson(request))
    exchanges.push({ request, outcome: outcomeToJson(outcome) })
  }
  return { exchanges }
}
