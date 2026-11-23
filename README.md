# seams

The seams hub: side effects go through ports, and libraries are built over them as pure code. Each port package holds the port's types, its JSON forms and a memory adapter, and most hold a generator that records a memory state from a real adapter.

## Packages

Ports:

- `@ai-swfactory-oss/clock`: the clock port, `now()` and `wait(duration)`, with a memory adapter that moves only on waits.
- `@ai-swfactory-oss/files`: the files port, a rooted snapshot in and a list of changes out, with a memory adapter that holds one Tree.
- `@ai-swfactory-oss/http`: the http port, `send(request)` returning a response or a typed network failure, where every request carries a body (empty means none) and a time limit, with a memory adapter that replays ordered exchanges.
- `@ai-swfactory-oss/process`: the process port, an invocation in and an execution out, with a memory adapter that answers from a lookup table.
- `@ai-swfactory-oss/random`: the random port, `bytes(n)` only, with a seeded memory adapter.
- `@ai-swfactory-oss/terminal`: the terminal port, `write`, `readLine` and `readAll` with a broken pipe as data, with a memory adapter and a Node adapter over the process's standard streams.

Libraries:

- `@ai-swfactory-oss/bytes`: pure byte helpers: a base64 codec, hex encoding and concatenation.
- `@ai-swfactory-oss/host`: host facts as one plain data type, with pure derivations such as the user cache base.
- `@ai-swfactory-oss/ids`: UUIDs built from the random port's bytes.
- `@ai-swfactory-oss/logging`: log records as data, formatted and written to stderr through the terminal port.
- `@ai-swfactory-oss/retry`: retries and polling as pure decisions, waiting only on the clock port.

Placeholders, each holding only a stub that describes its own name and a fake of it under `./testing`, to be deprecated once their replacements are released:

- `@ai-swfactory-oss/seams`
- `@ai-swfactory-oss/seams-archive`
- `@ai-swfactory-oss/seams-host`
- `@ai-swfactory-oss/seams-http-server`
- `@ai-swfactory-oss/seams-lint-kit`
- `@ai-swfactory-oss/seams-logger`
- `@ai-swfactory-oss/seams-module`
- `@ai-swfactory-oss/seams-node-runtime`
- `@ai-swfactory-oss/seams-process`
- `@ai-swfactory-oss/seams-retry`
- `@ai-swfactory-oss/seams-tool-runner`

## Licence

MIT
