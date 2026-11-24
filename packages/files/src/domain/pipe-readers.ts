interface PipeReader {
  readonly deliver: (line: string) => void
}

export interface PipeReaders {
  readonly open: (path: string, signal: AbortSignal) => AsyncIterable<string>
  readonly first: (path: string) => PipeReader | undefined
}

interface HeldReader extends PipeReader {
  readonly next: () => Promise<IteratorResult<string>>
  readonly close: () => void
}

const heldReader = (signal: AbortSignal, release: () => void): HeldReader => {
  const queued: string[] = []
  let waiting: ((result: IteratorResult<string>) => void) | undefined
  let closed = false
  const close = (): void => {
    if (closed) return
    closed = true
    release()
    waiting?.({ done: true, value: undefined })
    waiting = undefined
  }
  signal.addEventListener('abort', close, { once: true })
  return {
    deliver: line => {
      if (waiting === undefined) {
        queued.push(line)
        return
      }
      waiting({ done: false, value: line })
      waiting = undefined
    },
    next: () => {
      const line = queued.shift()
      if (line !== undefined) return Promise.resolve({ done: false, value: line })
      if (closed) return Promise.resolve({ done: true, value: undefined })
      return new Promise(resolve => {
        waiting = resolve
      })
    },
    close,
  }
}

export const NO_LINES: AsyncIterable<string> = {
  [Symbol.asyncIterator]: () => ({ next: () => Promise.resolve({ done: true, value: undefined }) }),
}

export const pipeReaders = (): PipeReaders => {
  const held = new Map<string, HeldReader[]>()
  const release = (path: string, reader: HeldReader): void => {
    const remaining = (held.get(path) ?? []).filter(other => other !== reader)
    if (remaining.length === 0) held.delete(path)
    else held.set(path, remaining)
  }
  return {
    open: (path, signal) => {
      if (signal.aborted) return NO_LINES
      const reader: HeldReader = heldReader(signal, () => {
        release(path, reader)
      })
      held.set(path, [...(held.get(path) ?? []), reader])
      return {
        [Symbol.asyncIterator]: () => ({
          next: reader.next,
          return: () => {
            reader.close()
            return Promise.resolve({ done: true, value: undefined })
          },
        }),
      }
    },
    first: path => held.get(path)?.[0],
  }
}
