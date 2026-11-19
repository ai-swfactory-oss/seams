import type { HttpHeaders, HttpRequestJson } from '../types'

const sameHeaders = (a: HttpHeaders, b: HttpHeaders): boolean =>
  a.length === b.length &&
  a.every(([name, value], index) => {
    const other = b[index]
    return other?.[0] === name && other[1] === value
  })

export const sameRequest = (a: HttpRequestJson, b: HttpRequestJson): boolean =>
  a.method === b.method && a.url === b.url && (a.body ?? '') === (b.body ?? '') && sameHeaders(a.headers, b.headers)
