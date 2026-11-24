import type { Tree } from '@ai-swfactory-oss/files'
import { describe, expect, it } from 'vitest'

import { gzip, listTgz, packTar } from '../src/index'

const text = (value: string): Uint8Array => new TextEncoder().encode(value)

const THREE: Tree = {
  entries: [
    { path: 'package/a.txt', kind: 'file', content: text('a\n'), executable: false },
    { path: 'package/b.txt', kind: 'file', content: text('bb\n'), executable: false },
    { path: 'package/c.txt', kind: 'file', content: text('ccc\n'), executable: false },
  ],
}

const ROOMY = { maxBytes: 1 << 20, maxEntries: 100 }

const SECOND_HEADER = 1024

describe('tgz entry listing is bounded and fails closed', () => {
  it('listing a tgz over the size limit fails instead of returning a list', async () => {
    const tgz = await gzip(packTar(THREE))
    const bomb = await gzip(packTar({ entries: [{ path: 'zeros', kind: 'file', content: new Uint8Array(1 << 16), executable: false }] }))

    expect([
      await listTgz(tgz, { ...ROOMY, maxBytes: tgz.length - 1 }),
      await listTgz(bomb, { ...ROOMY, maxBytes: 1 << 12 }),
      bomb.length < 1 << 12,
    ]).toStrictEqual([{ kind: 'too-large', limit: tgz.length - 1 }, { kind: 'too-large', limit: 1 << 12 }, true])
  })

  it('listing a tgz over the entry-count limit fails instead of returning a partial list', async () => {
    const tgz = await gzip(packTar(THREE))

    expect([await listTgz(tgz, { ...ROOMY, maxEntries: 2 }), await listTgz(tgz, { ...ROOMY, maxEntries: 3 })]).toStrictEqual([
      { kind: 'too-many-entries', limit: 2 },
      {
        kind: 'entries',
        entries: [
          { path: 'package/a.txt', kind: 'file', size: 2 },
          { path: 'package/b.txt', kind: 'file', size: 3 },
          { path: 'package/c.txt', kind: 'file', size: 4 },
        ],
      },
    ])
  })

  it('listing a tgz fails at the first malformed header and reports no partial list as complete', async () => {
    const tar = packTar(THREE)
    const corrupted = Uint8Array.from(tar, (byte, index) => (index === SECOND_HEADER ? byte ^ 0x01 : byte))

    expect(await listTgz(await gzip(corrupted), ROOMY)).toStrictEqual({ kind: 'malformed', reason: 'bad-checksum', offset: SECOND_HEADER })
  })
})
