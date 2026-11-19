import { type Tree, treeToJson } from '@ai-swfactory-oss/files'
import { createMemoryFiles } from '@ai-swfactory-oss/files/memory'
import { describe, expect, it } from 'vitest'

import { changesFromUpper, type UpperEntry } from '../src/index'
import { text } from './fixtures'

const LOWER: Tree = {
  entries: [
    { path: 'README.md', kind: 'file', content: text('hello\n'), executable: false },
    { path: 'bin/run', kind: 'file', content: text('#!/bin/sh\n'), executable: true },
    { path: 'cache/a', kind: 'file', content: text('a'), executable: false },
    { path: 'cache/b', kind: 'file', content: text('b'), executable: false },
    { path: 'current', kind: 'symlink', target: 'v1' },
    { path: 'old.txt', kind: 'file', content: text('old'), executable: false },
  ],
}

const UPPER: readonly UpperEntry[] = [
  { path: 'README.md', kind: 'file', content: text('hello, world\n'), executable: false },
  { path: 'bin', kind: 'directory', opaque: false },
  { path: 'bin/run', kind: 'file', content: text('#!/bin/sh\n'), executable: true },
  { path: 'cache', kind: 'directory', opaque: true },
  { path: 'cache/c', kind: 'file', content: text('c'), executable: false },
  { path: 'current', kind: 'symlink', target: 'v2' },
  { path: 'empty', kind: 'directory', opaque: false },
  { path: 'old.txt', kind: 'whiteout' },
]

describe('the upper layer becomes the change list', () => {
  it('lists writes, symlinks, deletes and new directories from the upper layer, leaving out a copied-up file that is unchanged', () => {
    expect(changesFromUpper(UPPER, LOWER)).toEqual([
      { kind: 'write', path: 'README.md', content: text('hello, world\n'), executable: false },
      { kind: 'delete', path: 'cache' },
      { kind: 'mkdir', path: 'cache' },
      { kind: 'write', path: 'cache/c', content: text('c'), executable: false },
      { kind: 'delete', path: 'current' },
      { kind: 'symlink', path: 'current', target: 'v2' },
      { kind: 'mkdir', path: 'empty' },
      { kind: 'delete', path: 'old.txt' },
    ])
  })

  it('lists a mode change on a copied-up file as a write', () => {
    const upper: readonly UpperEntry[] = [{ path: 'bin/run', kind: 'file', content: text('#!/bin/sh\n'), executable: false }]

    expect(changesFromUpper(upper, LOWER)).toEqual([{ kind: 'write', path: 'bin/run', content: text('#!/bin/sh\n'), executable: false }])
  })

  it('lists nothing for an empty upper layer', () => {
    expect(changesFromUpper([], LOWER)).toEqual([])
  })

  it('leaves the merged result when the list is applied to the lower tree', async () => {
    const created = createMemoryFiles(treeToJson(LOWER))
    if (created.kind === 'non-empty-directory') throw new Error(`the lower tree holds the non-empty directory ${created.path}`)

    const outcomes = await created.files.apply(changesFromUpper(UPPER, LOWER))

    expect([outcomes.every(outcome => outcome.kind === 'applied'), created.files.state()]).toEqual([
      true,
      treeToJson({
        entries: [
          { path: 'README.md', kind: 'file', content: text('hello, world\n'), executable: false },
          { path: 'bin/run', kind: 'file', content: text('#!/bin/sh\n'), executable: true },
          { path: 'cache/c', kind: 'file', content: text('c'), executable: false },
          { path: 'current', kind: 'symlink', target: 'v2' },
          { path: 'empty', kind: 'directory' },
        ],
      }),
    ])
  })
})
