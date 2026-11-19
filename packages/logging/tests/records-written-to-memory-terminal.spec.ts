import { createMemoryTerminal } from '@ai-swfactory-oss/terminal/memory'
import { describe, expect, it } from 'vitest'

import { createLogging, formatRecord, lineStyleOf, type LoggingData } from '../src/index'

const plain: LoggingData['facts'] = { env: {}, tty: { stdin: false, stdout: false, stderr: false, columns: undefined } }

const onTty = (env: LoggingData['facts']['env'], stderr: boolean): LoggingData['facts'] => ({
  env,
  tty: { stdin: true, stdout: true, stderr, columns: 80 },
})

describe('records written to the memory terminal', () => {
  it('writes a record as one stderr line: the level label, the message, then key=value fields in order', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: [] })
    const logging = createLogging({ facts: plain }, { ports: { terminal } })

    const outcome = await logging.log({
      level: 'info',
      message: 'listening',
      fields: { port: 8080, host: 'localhost', ready: true, user: null },
    })

    expect([outcome, terminal.state()]).toEqual([
      { kind: 'written' },
      { input: '', output: [{ stream: 'stderr', text: 'INFO listening port=8080 host=localhost ready=true user=null\n' }], closed: [] },
    ])
  })

  it('labels each level, and writes nothing to stdout', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: [] })
    const logging = createLogging({ facts: plain }, { ports: { terminal } })

    await logging.log({ level: 'debug', message: 'a' })
    await logging.log({ level: 'info', message: 'b' })
    await logging.log({ level: 'warn', message: 'c' })
    await logging.log({ level: 'error', message: 'd' })

    expect(terminal.state().output).toEqual([
      { stream: 'stderr', text: 'DEBUG a\n' },
      { stream: 'stderr', text: 'INFO b\n' },
      { stream: 'stderr', text: 'WARN c\n' },
      { stream: 'stderr', text: 'ERROR d\n' },
    ])
  })

  it('adds no time to a record; a caller that wants one puts it in the fields', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: [] })
    const logging = createLogging({ facts: plain }, { ports: { terminal } })

    await logging.log({ level: 'info', message: 'tick' })
    await logging.log({ level: 'info', message: 'tick', fields: { at: '2026-11-19T00:00:00.000Z' } })

    expect(terminal.state().output.map(write => write.text)).toEqual(['INFO tick\n', 'INFO tick at=2026-11-19T00:00:00.000Z\n'])
  })

  it('quotes a field value that is empty or holds a space, a quote or an equals sign, and keeps a message on one line', () => {
    const line = formatRecord(
      { level: 'warn', message: 'two\nlines', fields: { empty: '', path: 'a b', said: 'x"y', pair: 'k=v' } },
      { colour: false },
    )

    expect(line).toBe('WARN two\\nlines empty="" path="a b" said="x\\"y" pair="k=v"\n')
  })

  it('colours the level label only when stderr is a TTY and NO_COLOR is not set', async () => {
    const styles = [
      lineStyleOf(plain),
      lineStyleOf(onTty({}, true)),
      lineStyleOf(onTty({}, false)),
      lineStyleOf(onTty({ NO_COLOR: '1' }, true)),
      lineStyleOf(onTty({ NO_COLOR: '' }, true)),
    ]
    const terminal = createMemoryTerminal({ input: '', output: [], closed: [] })
    const logging = createLogging({ facts: onTty({}, true) }, { ports: { terminal } })

    await logging.log({ level: 'error', message: 'failed', fields: { code: 2 } })

    expect([styles, terminal.state().output]).toEqual([
      [{ colour: false }, { colour: true }, { colour: false }, { colour: false }, { colour: true }],
      [{ stream: 'stderr', text: '\u001b[31mERROR\u001b[39m failed code=2\n' }],
    ])
  })

  it('answers a record written after stderr has closed as closed, and collects nothing for it', async () => {
    const terminal = createMemoryTerminal({ input: '', output: [], closed: ['stderr'] })
    const logging = createLogging({ facts: plain }, { ports: { terminal } })

    expect([await logging.log({ level: 'info', message: 'lost' }), terminal.state().output]).toEqual([{ kind: 'closed' }, []])
  })
})
