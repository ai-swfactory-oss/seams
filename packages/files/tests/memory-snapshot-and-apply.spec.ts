import { describe, expect, it } from 'vitest'

import { type Change, type Tree, treeToJson } from '../src/index'
import { createMemoryFiles } from '../src/memory/index'

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

const SETUP: Tree = {
  entries: [
    { path: 'src/b.ts', kind: 'file', content: bytes('b'), executable: false },
    { path: 'src/a.ts', kind: 'file', content: bytes('a'), executable: false },
    { path: 'src/a.spec.ts', kind: 'file', content: bytes('spec'), executable: false },
    { path: 'bin/run', kind: 'file', content: bytes('#!'), executable: true },
    { path: 'link', kind: 'symlink', target: 'src/a.ts' },
    { path: 'empty', kind: 'directory' },
  ],
}

const everything = { root: '', include: [], exclude: [] }

const files = () => createMemoryFiles(treeToJson(SETUP))

describe('the memory files snapshot', () => {
  it('lists every entry sorted by path, with only empty directories listed', async () => {
    const tree = await files().snapshot(everything)

    expect(tree.entries.map(entry => `${entry.kind} ${entry.path}`)).toEqual([
      'file bin/run',
      'directory empty',
      'symlink link',
      'file src/a.spec.ts',
      'file src/a.ts',
      'file src/b.ts',
    ])
  })

  it('selects under its root by include and exclude patterns relative to that root', async () => {
    const tree = await files().snapshot({ root: 'src', include: ['*.ts'], exclude: ['*.spec.ts'] })

    expect(tree.entries.map(entry => entry.path)).toEqual(['src/a.ts', 'src/b.ts'])
  })

  it('selects nothing from a root that breaks the path rules or does not exist', async () => {
    const memory = files()

    const trees = await Promise.all(['../x', '/abs', 'missing'].map(root => memory.snapshot({ root, include: [], exclude: [] })))

    expect(trees).toEqual([{ entries: [] }, { entries: [] }, { entries: [] }])
  })
})

describe('the memory files apply', () => {
  it('applies each change in order and shows it in the next snapshot', async () => {
    const memory = files()

    const outcomes = await memory.apply([
      { kind: 'write', path: 'out/new.txt', content: bytes('new'), executable: false },
      { kind: 'move', from: 'src/b.ts', to: 'lib/b.ts' },
      { kind: 'delete', path: 'bin' },
      { kind: 'mkdir', path: 'empty' },
    ])
    const tree = await memory.snapshot(everything)

    expect([outcomes, tree.entries.map(entry => entry.path)]).toEqual([
      [{ kind: 'applied' }, { kind: 'applied' }, { kind: 'applied' }, { kind: 'applied' }],
      ['empty', 'lib/b.ts', 'link', 'out/new.txt', 'src/a.spec.ts', 'src/a.ts'],
    ])
  })

  it('stops at the first failure, skips the rest and keeps what was applied before it', async () => {
    const memory = files()

    const outcomes = await memory.apply([
      { kind: 'write', path: 'kept.txt', content: bytes('kept'), executable: false },
      { kind: 'delete', path: 'missing' },
      { kind: 'write', path: 'never.txt', content: bytes('never'), executable: false },
    ])
    const tree = await memory.snapshot({ root: '', include: ['*.txt'], exclude: [] })

    expect([outcomes, tree.entries.map(entry => entry.path)]).toEqual([
      [{ kind: 'applied' }, { kind: 'failed', reason: 'not-found' }, { kind: 'skipped' }],
      ['kept.txt'],
    ])
  })

  it('answers each failing change with its reason', async () => {
    const changes: Change[] = [
      { kind: 'write', path: '../out', content: bytes(''), executable: false },
      { kind: 'write', path: 'src', content: bytes(''), executable: false },
      { kind: 'write', path: 'src/a.ts/inner', content: bytes(''), executable: false },
      { kind: 'symlink', path: 'link', target: 'elsewhere' },
      { kind: 'move', from: 'src', to: 'src/inside' },
      { kind: 'delete', path: 'missing' },
    ]

    const reasons = await Promise.all(
      changes.map(async change => {
        const [outcome] = await files().apply([change])
        return outcome
      }),
    )

    expect(reasons).toEqual([
      { kind: 'failed', reason: 'invalid-path' },
      { kind: 'failed', reason: 'is-a-directory' },
      { kind: 'failed', reason: 'not-a-directory' },
      { kind: 'failed', reason: 'exists' },
      { kind: 'failed', reason: 'invalid-path' },
      { kind: 'failed', reason: 'not-found' },
    ])
  })

  it('reports its state as the JSON form of the tree it holds', async () => {
    const memory = files()

    await memory.apply([{ kind: 'write', path: 'empty/hello', content: bytes('hi'), executable: true }])

    expect(memory.state().entries.find(entry => entry.path === 'empty/hello')).toEqual({
      path: 'empty/hello',
      kind: 'file',
      content: 'aGk=',
      executable: true,
    })
  })
})
