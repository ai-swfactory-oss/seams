import { takeLine } from '../domain/lines'
import type { Terminal, TerminalState, TerminalStream, TerminalWrite, WriteOutcome } from '../index'

export interface MemoryTerminal extends Terminal {
  readonly state: () => TerminalState
}

export const createMemoryTerminal = (initial: TerminalState): MemoryTerminal => {
  const closed: readonly TerminalStream[] = [...initial.closed]
  let input = initial.input
  let output: readonly TerminalWrite[] = [...initial.output]
  return {
    write: (stream, text) => {
      if (closed.includes(stream)) return Promise.resolve<WriteOutcome>({ kind: 'closed' })
      output = [...output, { stream, text }]
      return Promise.resolve<WriteOutcome>({ kind: 'written' })
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
    state: () => ({ input, output: output.map(write => ({ ...write })), closed: [...closed] }),
  }
}
