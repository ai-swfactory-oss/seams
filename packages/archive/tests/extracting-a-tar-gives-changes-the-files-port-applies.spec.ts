import { type Tree, treeFromJson, treeToJson } from '@ai-swfactory-oss/files'
import { createMemoryFiles } from '@ai-swfactory-oss/files/memory'
import { describe, expect, it } from 'vitest'

import { extractTar, packTar } from '../src/index'

const text = (value: string): Uint8Array => new TextEncoder().encode(value)

const PACKED: Tree = {
  entries: [
    { path: 'bin/run', kind: 'file', content: text('#!/bin/sh\n'), executable: true },
    { path: 'empty', kind: 'directory' },
    { path: 'events', kind: 'pipe' },
    { path: 'link', kind: 'symlink', target: 'src/a.ts' },
    { path: 'src/a.ts', kind: 'file', content: text('export const a = 1\n'), executable: false },
  ],
}

const EXTRACTED: Tree = {
  entries: [
    { path: 'keep.txt', kind: 'file', content: text('kept\n'), executable: false },
    { path: 'out/bin/run', kind: 'file', content: text('#!/bin/sh\n'), executable: true },
    { path: 'out/empty', kind: 'directory' },
    { path: 'out/events', kind: 'pipe' },
    { path: 'out/link', kind: 'symlink', target: 'src/a.ts' },
    { path: 'out/src/a.ts', kind: 'file', content: text('export const a = 1\n'), executable: false },
  ],
}

describe('extracting a tar gives changes the files port applies', () => {
  it('applying the changes extracted from tar bytes under a folder puts the packed tree there', async () => {
    const created = createMemoryFiles(
      treeToJson({ entries: [{ path: 'keep.txt', kind: 'file', content: text('kept\n'), executable: false }] }),
    )
    if (created.kind !== 'files') throw new Error(created.kind)
    const extracted = extractTar(packTar(PACKED), 'out')
    if (extracted.kind !== 'changes') throw new Error(extracted.reason)

    const outcomes = await created.files.apply(extracted.changes)

    expect([outcomes.every(outcome => outcome.kind === 'applied'), treeFromJson(created.files.state())]).toStrictEqual([
      true,
      { kind: 'tree', tree: EXTRACTED },
    ])
  })
})
