import type { Terminal, TerminalState, TerminalStream, TerminalWrite } from '../index'

export interface TerminalProbe {
  readonly writes: readonly TerminalWrite[]
}

export const generateTerminalState = async (probe: TerminalProbe, ports: { readonly terminal: Terminal }): Promise<TerminalState> => {
  const { terminal } = ports
  const input = await terminal.readAll()
  const output: TerminalWrite[] = []
  const closed: TerminalStream[] = []
  for (const write of probe.writes) {
    const outcome = await terminal.write(write.stream, write.text)
    if (outcome.kind === 'written') output.push(write)
    else if (!closed.includes(write.stream)) closed.push(write.stream)
  }
  return { input, output, closed }
}
