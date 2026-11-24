import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE = join(HERE, '..')
const OUTPUT = join(PACKAGE, 'tests', 'generated', 'standard-results.json')
const WAIT = 5

const { generateClockState } = await import(join(PACKAGE, 'dist', 'generate', 'index.js'))
const { createStandardClock } = await import(join(PACKAGE, 'dist', 'standard', 'index.js'))

const ports = { clock: createStandardClock() }
const before = generateClockState({ ports })
await ports.clock.wait(WAIT)
const after = generateClockState({ ports })

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, `${JSON.stringify({ wait: { duration: WAIT, before, after } }, null, 2)}\n`)
