# @ai-swfactory-oss/retry

Retries and polling as a pure library over the clock port. The library decides each step; the caller loops.

- `nextStep(policy, attempts, lastFailure)` says what to do after a failed try: `{ wait }` milliseconds, or `{ stop }` with how it gave up. It takes no port. A failure whose `retryable` is false stops at once, a failure's retry hint is a minimum wait, and the tries are bounded; running out of them is returned as data, with the last failure.
- `nextCheck(policy, checks, elapsedMs, lastFailure)` does the same for polling a condition: one check per interval (or per hint, when that is longer), within a time limit. When time runs out with no failure it stops with a failure whose `detail.code` is `condition-not-held` (exported as `CONDITION_NOT_HELD`).
- `createRetry(policy, { clock })` is the only entry that takes a port. It refuses a policy whose numbers are not finite and zero or more, with an `InvalidPolicyError`, and returns `{ waitFor }`: `waitFor(step)` waits out a `{ wait }` step on the clock, the library's only effect.

Failures are `Failure` data from `@ai-swfactory-oss/sdk-vocabulary`; nothing is thrown for a failed try.

## The caller loop

A caller tries its operation, counting tries from one. A value ends the loop. A failure goes to `nextStep` with the count so far: a `{ stop }` step is the loop's result, and a `{ wait }` step is passed to `waitFor` before the next try. Polling is the same, except that "not yet" is passed to `nextCheck` as an undefined failure, along with the time elapsed on the clock since the first check.

The package's one caller loop, for both, is [`tests/loop.ts`](tests/loop.ts); the specs run the library through it on the memory clock.

## Licence

MIT
