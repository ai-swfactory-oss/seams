// Records a real broken pipe: a child process runs the terminal generator over its own standard
// streams, with the reader of its stdout closed before it writes. The gate runs this module and
// commits what it writes.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, writeSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE = join(HERE, '..')
const OUTPUT = join(PACKAGE, 'tests', 'generated', 'broken-pipe.json')
const CHILD = 'child'
const RESULT_FD = 3
const INPUT = 'first line\nsecond line\n'
const PROBE = {
  writes: [
    { stream: 'stdout', text: 'to a reader that is gone\n' },
    { stream: 'stderr', text: 'to a reader that is there\n' },
  ],
}

const runChild = async () => {
  const { generateTerminalState } = await import(join(PACKAGE, 'dist', 'generate', 'index.js'))
  const { createNodeTerminal } = await import(join(PACKAGE, 'dist', 'node', 'index.js'))
  const state = await generateTerminalState(PROBE, { terminal: createNodeTerminal() })
  writeSync(RESULT_FD, JSON.stringify(state))
}

const runParent = () =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), CHILD], { stdio: ['pipe', 'pipe', 'pipe', 'pipe'] })
    let result = ''
    child.stdio[RESULT_FD].setEncoding('utf8')
    child.stdio[RESULT_FD].on('data', chunk => {
      result += chunk
    })
    let errors = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => {
      errors += chunk
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve(JSON.parse(result))
      else reject(new Error(`the broken-pipe child exited ${String(code)}:\n${errors}`))
    })
    child.stdout.once('close', () => child.stdin.end(INPUT))
    child.stdout.destroy()
  })

if (process.argv[2] === CHILD) {
  await runChild()
} else {
  const state = await runParent()
  mkdirSync(dirname(OUTPUT), { recursive: true })
  // Written as the formatter writes JSON: a list of strings stays on one line.
  const text = JSON.stringify(state, null, 2).replace(
    /\[\n\s+("[^"\n]*"(?:,\n\s+"[^"\n]*")*)\n\s*\]/gu,
    (_, items) => `[${items.split(/,\n\s+/u).join(', ')}]`,
  )
  writeFileSync(OUTPUT, `${text}\n`)
}
