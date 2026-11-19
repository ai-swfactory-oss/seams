import { describe, expect, it } from 'vitest'

import { parseTerminalState } from '../src/index'
import { createMemoryTerminal } from '../src/memory/index'

describe('the memory terminal', () => {
  it('replays scripted input line by line, then reports its end', async () => {
    const terminal = createMemoryTerminal({ input: 'one\r\ntwo\nthree', output: [], closed: [] })

    const lines = [await terminal.readLine(), await terminal.readLine(), await terminal.readLine(), await terminal.readLine()]

    expect(lines).toEqual(['one', 'two', 'three', undefined])
  })

  it('reads all input not read yet, and nothing after that', async () => {
    const terminal = createMemoryTerminal({ input: 'head\nbody\nmore\n', output: [], closed: [] })

    await terminal.readLine()

    expect([await terminal.readAll(), await terminal.readAll()]).toEqual(['body\nmore\n', ''])
  })

  it('collects every write in order, with its stream', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: [] })

    const outcomes = [await terminal.write('stdout', 'a'), await terminal.write('stderr', 'b'), await terminal.write('stdout', 'c')]

    expect([outcomes, terminal.state().output]).toEqual([
      [{ kind: 'written' }, { kind: 'written' }, { kind: 'written' }],
      [
        { stream: 'stdout', text: 'a' },
        { stream: 'stderr', text: 'b' },
        { stream: 'stdout', text: 'c' },
      ],
    ])
  })

  it('answers a write to a stream whose reader is gone as closed, and collects nothing for it', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: ['stdout'] })

    const outcomes = [await terminal.write('stdout', 'lost'), await terminal.write('stderr', 'kept')]

    expect([outcomes, terminal.state().output]).toEqual([[{ kind: 'closed' }, { kind: 'written' }], [{ stream: 'stderr', text: 'kept' }]])
  })

  it('reports a state that survives a JSON round trip', async () => {
    const terminal = createMemoryTerminal({ input: 'x\ny\n', output: [], closed: ['stderr'] })
    await terminal.readLine()
    await terminal.write('stdout', 'seen')

    expect(parseTerminalState(JSON.parse(JSON.stringify(terminal.state())))).toEqual({
      input: 'y\n',
      output: [{ stream: 'stdout', text: 'seen' }],
      closed: ['stderr'],
    })
  })

  it('continues from a reported state', async () => {
    const terminal = createMemoryTerminal({ input: 'x\ny\n', output: [], closed: [] })
    await terminal.readLine()

    expect(await createMemoryTerminal(terminal.state()).readLine()).toBe('y')
  })

  it('reads no state from a value that does not hold one', () => {
    expect(
      [
        null,
        { input: '', output: [] },
        { input: '', output: [{ stream: 'stdin', text: 'x' }], closed: [] },
        { input: '', output: [], closed: ['tty'] },
      ].map(parseTerminalState),
    ).toEqual([undefined, undefined, undefined, undefined])
  })
})
