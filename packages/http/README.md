# @ai-swfactory-oss/http

The http port: `send(request)` answers an `HttpResponse` or an `HttpFailure`, never a thrown error.

- `.` holds the port's types and the JSON forms of its requests, outcomes and state.
- `./memory` replays recorded exchanges in order and reports the ones left over.
- `./generate` records exchanges by sending requests through a real adapter.
- `./node` is the standard adapter over the platform's `fetch`.

## The standard adapter

`createNodeHttp()` sends each request's method, URL, headers and body as given, within its `timeLimitMs`, and adds nothing to the request itself. It follows no redirect: a redirect response is answered as that response. A network failure is answered as an `HttpFailure` with its reason (`dns`, `refused`, `reset`, `tls`, `timed-out` or `other`), and a request that outlives its time limit is answered as `timed-out`.

Its limitations come from the platform's `fetch`:

- `fetch` adds forbidden headers of its own to a request, such as `user-agent`, `accept`, `accept-language`, `sec-fetch-mode`, `host`, `connection` and `content-length`.
- `fetch` adds `accept-encoding` and decompresses a compressed response transparently, so the answered body is the decoded body.

An adapter over Node's own http modules, for proxy or CA settings or a strict wire, waits until a consumer needs it.

The adapter's real exchanges, including real network failures, are recorded by `tools/generate-node-exchanges.mjs` into `tests/generated/node-exchanges.json`, and the memory adapter replays them.

## Licence

MIT
