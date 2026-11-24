import type { Tree } from '@ai-swfactory-oss/files'
import { describe, expect, it } from 'vitest'

import { packTar, unpackTar } from '../src/index'

const text = (value: string): Uint8Array => new TextEncoder().encode(value)

const PREFIXED = `${'p'.repeat(60)}/${'q'.repeat(60)}/name.txt`

const PAX_ONLY = `${'r'.repeat(120)}/${'s'.repeat(120)}/naïve-ünïcode.txt`

const TREE: Tree = {
  entries: [
    { path: 'bin/run', kind: 'file', content: text('#!/bin/sh\necho run\n'), executable: true },
    { path: 'empty', kind: 'directory' },
    { path: 'events', kind: 'pipe' },
    { path: 'far', kind: 'symlink', target: `../${'t'.repeat(150)}` },
    { path: 'link', kind: 'symlink', target: 'src/a.ts' },
    { path: PREFIXED, kind: 'file', content: text('prefixed\n'), executable: false },
    { path: PAX_ONLY, kind: 'file', content: text('pax\n'), executable: false },
    { path: 'src/a.ts', kind: 'file', content: text('export const a = 1\n'), executable: false },
    { path: 'src/block.bin', kind: 'file', content: new Uint8Array(1024).fill(7), executable: false },
    { path: 'src/empty.txt', kind: 'file', content: new Uint8Array(), executable: false },
  ],
}

describe('tar round trip over a tree', () => {
  it('packing a tree into tar bytes and unpacking them gives back the same tree', () => {
    expect(unpackTar(packTar(TREE))).toStrictEqual({ kind: 'tree', tree: TREE })
  })
})
