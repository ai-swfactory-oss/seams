import { mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE = join(HERE, '..')
const OUTPUT = join(PACKAGE, 'tests', 'generated', 'node-exchanges.json')
const LIMIT = 5_000
const SHORT_LIMIT = 200

const base64 = text => Buffer.from(text, 'utf8').toString('base64')

const listen = handler =>
  new Promise(resolve => {
    const received = []
    const server = createServer((request, response) => {
      const chunks = []
      request.on('data', chunk => chunks.push(chunk))
      request.on('end', () => {
        const headers = []
        for (let index = 0; index < request.rawHeaders.length; index += 2) {
          headers.push([request.rawHeaders[index].toLowerCase(), request.rawHeaders[index + 1]])
        }
        received.push({ method: request.method, url: request.url, headers, body: Buffer.concat(chunks).toString('base64') })
        handler(response)
      })
    })
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({
        origin: `http://127.0.0.1:${String(address.port)}`,
        received,
        close: () =>
          new Promise(done => {
            server.closeAllConnections()
            server.close(() => done())
          }),
      })
    })
  })

const answer = (status, headers, body) => response => {
  response.sendDate = false
  response.writeHead(status, [...headers, ['content-length', String(Buffer.byteLength(body))], ['connection', 'close']].flat())
  response.end(body)
}

const { generateHttpExchanges } = await import(join(PACKAGE, 'dist', 'generate', 'index.js'))
const { createNodeHttp } = await import(join(PACKAGE, 'dist', 'node', 'index.js'))

const exchanged = async requests => generateHttpExchanges({ requests }, { ports: { http: createNodeHttp() } })

const request = (method, url, headers, body, timeLimitMs = LIMIT) => ({ method, url, headers, body: base64(body), timeLimitMs })

const served = async (name, handler, requestAt) => {
  const server = await listen(handler)
  try {
    const state = await exchanged([requestAt(server.origin)])
    return { name, state, received: server.received }
  } finally {
    await server.close()
  }
}

const cases = [
  await served('a request sent exactly as given', answer(204, [], ''), origin =>
    request(
      'POST',
      `${origin}/items?q=1`,
      [
        ['content-type', 'application/json'],
        ['x-trace', 'abc'],
      ],
      '{"a":1}',
    ),
  ),
  await served(
    'a response answered as received',
    answer(
      201,
      [
        ['content-type', 'text/plain'],
        ['x-answer', '42'],
      ],
      'hello',
    ),
    origin => request('GET', `${origin}/answer`, [], ''),
  ),
  await served('a redirect answered as that response', answer(302, [['location', '/elsewhere']], ''), origin =>
    request('GET', `${origin}/from`, [], ''),
  ),
  await served('a request whose tls handshake fails', answer(200, [], 'plain'), origin =>
    request('GET', origin.replace('http://', 'https://'), [], ''),
  ),
  await served(
    'a request that outlives its time limit',
    () => undefined,
    origin => request('GET', `${origin}/slow`, [], '', SHORT_LIMIT),
  ),
]

const closed = await listen(answer(200, [], ''))
await closed.close()
cases.push({ name: 'a request to a refused port', state: await exchanged([request('GET', `${closed.origin}/`, [], '')]), received: [] })
cases.push({
  name: 'a request to an unresolvable host',
  state: await exchanged([request('GET', 'http://unresolvable.invalid/', [], '')]),
  received: [],
})

mkdirSync(dirname(OUTPUT), { recursive: true })
const text = JSON.stringify({ cases }, null, 2)
  .replace(/127\.0\.0\.1:\d+/gu, '127.0.0.1:PORT')
  .replace(
    /\[\n\s+("[^"\n]*"(?:,\n\s+"[^"\n]*")*)\n\s*\]/gu,
    (...groups) =>
      `[${String(groups[1])
        .split(/,\n\s+/u)
        .join(', ')}]`,
  )
writeFileSync(OUTPUT, `${text}\n`)
