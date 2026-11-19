import { outcomeToJson, requestFromJson, requestToJson } from '../domain/json'
import type { Http, HttpExchangeJson, HttpRequestJson, HttpState } from '../types'

export interface HttpGeneration {
  readonly requests: readonly HttpRequestJson[]
}

export const generateHttpExchanges = async (
  call: HttpGeneration,
  { ports }: { readonly ports: { readonly http: Http } },
): Promise<HttpState> => {
  const exchanges: HttpExchangeJson[] = []
  for (const json of call.requests) {
    const request = requestFromJson(json)
    const outcome = await ports.http.send(request)
    exchanges.push({ request: requestToJson(request), outcome: outcomeToJson(outcome) })
  }
  return { exchanges }
}
