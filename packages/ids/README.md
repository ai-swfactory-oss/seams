# @ai-swfactory-oss/ids

UUIDs built from the bytes of the random port of `@ai-swfactory-oss/random`, as a pure library.

- `createIdsSdk(data, { random })` is the only entry that takes a port. It returns the id operations, which take data only.
- `uuid()` returns a version 4, variant 1 UUID in its canonical form, built from sixteen bytes drawn from the random port. Only the version and variant bits are set; the other bits are the drawn bytes.

```ts
import { createIdsSdk } from '@ai-swfactory-oss/ids'
import { createMemoryRandom } from '@ai-swfactory-oss/random/memory'

const ids = createIdsSdk({}, { random: createMemoryRandom({ seed: 7, drawn: 0 }) })
ids.uuid()
```

## Licence

MIT
