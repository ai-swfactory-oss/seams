import { describe, expect, it } from 'vitest'

import { parseTerminalState } from '../src/index'
import { createMemoryTerminal } from '../src/memory/index'
import generated from './generated/broken-pipe.json'

describe('a broken pipe is typed data', () => {
  it('records a real write to a gone reader as a closed stream, and a write to a present one as output', () => {
    expect(parseTerminalState(generated)).toEqual({
      input: 'first line\nsecond line\n',
      output: [{ stream: 'stderr', text: 'to a reader that is there\n' }],
      closed: ['stdout'],
    })
  })

  it('answers a write after the recorded broken pipe as closed, without throwing', async () => {
    const state = parseTerminalState(generated)
    if (state === undefined) throw new Error('the generated broken-pipe result holds no terminal state')
    const terminal = createMemoryTerminal({ ...state, output: [] })

    const outcomes = [await terminal.write('stdout', 'more'), await terminal.write('stderr', 'still here')]

    expect([outcomes, terminal.state().output]).toEqual([
      [{ kind: 'closed' }, { kind: 'written' }],
      [{ stream: 'stderr', text: 'still here' }],
    ])
  })
})
