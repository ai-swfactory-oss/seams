import { execFile } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const HERE = dirname(fileURLToPath(import.meta.url))
const PACKAGE = join(HERE, '..')
const OUTPUT = join(PACKAGE, 'tests', 'generated', 'node-results.json')

const run = promisify(execFile)

const base64 = text => Buffer.from(text, 'utf8').toString('base64')
const file = (path, text, executable = false) => ({ path, kind: 'file', content: base64(text), executable })
const write = (path, text, executable = false) => ({ kind: 'write', path, content: base64(text), executable })

const SETUP = {
  entries: [
    file('src/a.ts', 'export const a = 1\n'),
    file('src/a.spec.ts', 'a spec\n'),
    file('src/deep/b.ts', 'export const b = 2\n'),
    file('bin/run', '#!/bin/sh\necho run\n', true),
    { path: 'link', kind: 'symlink', target: 'src/a.ts' },
    { path: 'linked-dir', kind: 'symlink', target: 'src' },
    { path: 'empty', kind: 'directory' },
  ],
}

const EVERYTHING = { root: '', include: [], exclude: [] }

const afterwards = change => ({ setup: SETUP, selection: EVERYTHING, changes: [change, write('after.txt', 'after\n')] })

const CASES = [
  { name: 'snapshot of every entry', generation: { setup: SETUP, selection: EVERYTHING, changes: [] } },
  {
    name: 'snapshot under a root by include and exclude patterns',
    generation: { setup: SETUP, selection: { root: 'src', include: ['**/*.ts'], exclude: ['*.spec.ts'] }, changes: [] },
  },
  {
    name: 'snapshot of a root that is a symlink to a directory',
    generation: { setup: SETUP, selection: { root: 'linked-dir', include: [], exclude: [] }, changes: [] },
  },
  {
    name: 'every kind of change applied',
    generation: {
      setup: SETUP,
      selection: EVERYTHING,
      changes: [
        write('new/nested/c.ts', 'c\n'),
        write('src/a.ts', 'export const a = 3\n'),
        write('bin/tool', '#!/bin/sh\n', true),
        write('bin/run', 'no longer executable\n'),
        write('link', 'a file where the symlink was\n'),
        { kind: 'symlink', path: 'links/to-b', target: '../src/deep/b.ts' },
        { kind: 'mkdir', path: 'made/here' },
        { kind: 'mkdir', path: 'src' },
        { kind: 'delete', path: 'src/a.spec.ts' },
        { kind: 'delete', path: 'empty' },
        { kind: 'move', from: 'src/deep', to: 'lib/moved' },
        { kind: 'move', from: 'new/nested/c.ts', to: 'c.ts' },
        { kind: 'delete', path: 'linked-dir' },
      ],
    },
  },
  ...[
    ['an absolute path', write('/abs', 'x')],
    ['a path that leaves the root', write('../out', 'x')],
    ['the root itself', { kind: 'delete', path: '' }],
    ['a delete of a missing path', { kind: 'delete', path: 'missing' }],
    ['a symlink over an existing file', { kind: 'symlink', path: 'src/a.ts', target: 'x' }],
    ['a mkdir over an existing file', { kind: 'mkdir', path: 'bin/run' }],
    ['a write over a directory', write('src', 'x')],
    ['a write under a file', write('src/a.ts/x', 'x')],
    ['a write under a symlink to a directory', write('linked-dir/x.ts', 'x')],
    ['a move into itself', { kind: 'move', from: 'src', to: 'src/inner' }],
    ['a move of a missing path', { kind: 'move', from: 'missing', to: 'there' }],
    ['a move onto an existing path', { kind: 'move', from: 'src/a.ts', to: 'bin/run' }],
    ['a move under a file', { kind: 'move', from: 'src/a.ts', to: 'bin/run/a.ts' }],
    ['a pipe change', { kind: 'pipe', path: 'events' }],
    ['a link from a missing path', { kind: 'link', from: 'missing', to: 'there' }],
    ['a link from a directory', { kind: 'link', from: 'src/deep', to: 'there' }],
    ['a link onto an existing path', { kind: 'link', from: 'src/a.ts', to: 'bin/run' }],
  ].map(([name, change]) => ({ name: `${name} fails, and the change after it is skipped`, generation: afterwards(change) })),
  ...[
    ['a link change gives a file a second name', []],
    ['a write to one name of a linked file leaves the other name unchanged', [write('src/a.ts', 'export const a = 4\n')]],
    ['a delete of one name of a linked file leaves the other name', [{ kind: 'delete', path: 'src/a.ts' }]],
  ].map(([name, then]) => ({
    name,
    generation: { setup: SETUP, selection: EVERYTHING, changes: [{ kind: 'link', from: 'src/a.ts', to: 'names/a.ts' }, ...then] },
  })),
]

const { generateFilesResults } = await import(join(PACKAGE, 'dist', 'generate', 'index.js'))
const { createNodeFiles } = await import(join(PACKAGE, 'dist', 'node', 'index.js'))

const inFreshRoot = async use => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'files-node-')))
  try {
    return await use(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const cases = []
for (const { name, generation } of CASES) {
  const generated = await inFreshRoot(root => generateFilesResults(generation, { files: createNodeFiles({ root }) }))
  if (generated.kind !== 'results') throw new Error(`the case "${name}" was refused: ${generated.kind}`)
  cases.push({ name, generation, results: generated.results })
}

const reading = await inFreshRoot(async root => {
  await run('mkfifo', [join(root, 'events')])
  const files = createNodeFiles({ root })
  const controller = new AbortController()
  const iterator = files.readLines('events', { signal: controller.signal })[Symbol.asyncIterator]()
  const written = [await files.writeLine('events', 'first'), await files.writeLine('events', 'second\nthird')]
  const lines = [(await iterator.next()).value, (await iterator.next()).value, (await iterator.next()).value]
  controller.abort()
  const ended = (await iterator.next()).done === true
  return { written, lines, ended }
})

const noReader = await inFreshRoot(async root => {
  await run('mkfifo', [join(root, 'events')])
  return createNodeFiles({ root }).writeLine('events', 'dropped')
})

mkdirSync(dirname(OUTPUT), { recursive: true })
const text = JSON.stringify({ cases, pipe: { reading, noReader } }, null, 2).replace(
  /\[\n\s+("[^"\n]*"(?:,\n\s+"[^"\n]*")*)\n\s*\]/gu,
  (_, items) => `[${items.split(/,\n\s+/u).join(', ')}]`,
)
writeFileSync(OUTPUT, `${text}\n`)
