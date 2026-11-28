import { describe, expect, it } from 'vitest'

import { createMemoryTerminal } from '../src/memory/index'

describe('the memory terminal holds its writes until released', () => {
  it('a held write is still pending before release', async () => {
    expect(
      await Promise.race([
        createMemoryTerminal({ input: '', output: [], closed: [], holdWrites: true }).write('stdout', 'a'),
        Promise.resolve('pending'),
      ]),
    ).toEqual('pending')
  })

  it('a held write is listed as pending and not in output', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: [], holdWrites: true })

    expect(await Promise.race([terminal.write('stdout', 'a'), Promise.resolve(terminal.state())])).toEqual({
      input: '',
      output: [],
      closed: [],
      holdWrites: true,
      pending: [{ stream: 'stdout', text: 'a' }],
    })
  })

  it('release records the held writes in call order and resolves them as written', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: [], holdWrites: true })
    const writes = [terminal.write('stdout', 'a'), terminal.write('stderr', 'b')]

    terminal.release()

    expect([await Promise.all(writes), terminal.state()]).toEqual([
      [{ kind: 'written' }, { kind: 'written' }],
      {
        input: '',
        output: [
          { stream: 'stdout', text: 'a' },
          { stream: 'stderr', text: 'b' },
        ],
        closed: [],
        holdWrites: true,
        pending: [],
      },
    ])
  })

  it('without holdWrites a write is recorded at once and resolves as written', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: [] })

    expect([await terminal.write('stdout', 'a'), terminal.state()]).toEqual([
      { kind: 'written' },
      { input: '', output: [{ stream: 'stdout', text: 'a' }], closed: [] },
    ])
  })

  it('a held write to a closed stream resolves as closed on release and records nothing', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: ['stdout'], holdWrites: true })
    const writes = [terminal.write('stdout', 'a')]

    terminal.release()

    expect([await Promise.all(writes), terminal.state()]).toEqual([
      [{ kind: 'closed' }],
      { input: '', output: [], closed: ['stdout'], holdWrites: true, pending: [] },
    ])
  })
})
