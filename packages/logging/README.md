# @ai-swfactory-oss/logging

Logging as a pure library over the terminal port of `@ai-swfactory-oss/terminal`. Log records are data.

- `createLoggingSdk({ facts }, { terminal })` is the only entry that takes a port, and it takes the terminal by name. Its `facts` are the host facts `env` and `tty`, which decide whether the level label is coloured.
- `log(record)` writes the record to stderr as one line: the level label, the message, then the record's fields as `key=value` in order. It returns the terminal's write outcome as data.
- `formatRecord(record, style)` and `lineStyleOf(facts)` are the line format and the colour decision on their own. They take data only.

The label is coloured only when stderr is a TTY and `NO_COLOR` is unset or empty. No time is added to a record; a caller that wants one puts it in the fields.

```ts
import { createLoggingSdk } from '@ai-swfactory-oss/logging'
import { createMemoryTerminal } from '@ai-swfactory-oss/terminal/memory'

const terminal = createMemoryTerminal({ input: '', output: [], closed: [] })
const logging = createLoggingSdk(
  { facts: { env: {}, tty: { stdin: false, stdout: false, stderr: false, columns: undefined } } },
  { terminal },
)
await logging.log({ level: 'info', message: 'ready', fields: { port: 8080 } })
```

## Licence

MIT
