import { takeLine } from '../domain/lines'
import type { Terminal, TerminalState, TerminalStream, TerminalWrite, WriteOutcome } from '../index'

export interface MemoryTerminal extends Terminal {
  readonly state: () => TerminalState
  readonly release: () => void
}

interface HeldWrite {
  readonly write: TerminalWrite
  readonly settle: (outcome: WriteOutcome) => void
}

export const createMemoryTerminal = (initial: TerminalState): MemoryTerminal => {
  const closed: readonly TerminalStream[] = [...initial.closed]
  const holdWrites = initial.holdWrites === true
  let input = initial.input
  let output: readonly TerminalWrite[] = [...initial.output]
  let held: readonly HeldWrite[] = (initial.pending ?? []).map(write => ({ write: { ...write }, settle: () => undefined }))
  const settled = (write: TerminalWrite): WriteOutcome => {
    if (closed.includes(write.stream)) return { kind: 'closed' }
    output = [...output, write]
    return { kind: 'written' }
  }
  return {
    write: (stream, text) => {
      if (!holdWrites) return Promise.resolve(settled({ stream, text }))
      return new Promise<WriteOutcome>(resolve => {
        held = [...held, { write: { stream, text }, settle: resolve }]
      })
    },
    release: () => {
      const releasing = held
      held = []
      for (const { write, settle } of releasing) settle(settled(write))
    },
    readLine: () => {
      const { line, rest } = takeLine(input)
      input = rest
      return Promise.resolve(line)
    },
    readAll: () => {
      const all = input
      input = ''
      return Promise.resolve(all)
    },
    state: () => ({
      input,
      output: output.map(write => ({ ...write })),
      closed: [...closed],
      ...(holdWrites ? { holdWrites, pending: held.map(({ write }) => ({ ...write })) } : {}),
    }),
  }
}
