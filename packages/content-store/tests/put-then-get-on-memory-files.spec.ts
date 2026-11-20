import { type Tree, treeDigest } from '@ai-swfactory-oss/files'
import { describe, expect, it } from 'vitest'

import { contentStoreAt } from './content-store-at'
import { memoryFilesOver } from './memory-files'

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

const TREE: Tree = {
  entries: [
    { path: 'bin/run', kind: 'file', content: bytes('#!'), executable: true },
    { path: 'empty', kind: 'directory' },
    { path: 'link', kind: 'symlink', target: 'src/a.ts' },
    { path: 'src/a.ts', kind: 'file', content: bytes('a'), executable: false },
  ],
}

const storeOn = (files = memoryFilesOver({ entries: [] })) => ({ files, store: contentStoreAt('store', files) })

describe('put then get on memory files', () => {
  it('puts a tree under the Tree digest the files package exports', async () => {
    const { store } = storeOn()

    expect(await store.put(TREE)).toEqual({ kind: 'stored', digest: await treeDigest(TREE) })
  })

  it('gets back the tree it put, by its digest', async () => {
    const { store } = storeOn()

    await store.put(TREE)

    expect(await store.get(await treeDigest(TREE))).toEqual({ kind: 'tree', tree: TREE })
  })

  it('writes the tree under its root, at its digest', async () => {
    const { files, store } = storeOn()
    const digest = await treeDigest(TREE)

    await store.put(TREE)

    expect(files.state().entries.map(entry => `${entry.kind} ${entry.path}`)).toEqual([
      `file store/${digest}/bin/run`,
      `directory store/${digest}/empty`,
      `symlink store/${digest}/link`,
      `file store/${digest}/src/a.ts`,
    ])
  })

  it('puts the same tree a second time to the same digest and leaves the files as they were', async () => {
    const { files, store } = storeOn()

    const first = await store.put(TREE)
    const before = files.state()
    const second = await store.put(TREE)

    expect([second, files.state()]).toEqual([first, before])
    expect(second).toEqual({ kind: 'stored', digest: await treeDigest(TREE) })
  })

  it('returns missing for a digest it never put', async () => {
    const { store } = storeOn()

    expect(await store.get(await treeDigest(TREE))).toEqual({ kind: 'missing' })
  })

  it('returns missing for a digest whose stored tree no longer digests to it', async () => {
    const { files, store } = storeOn()
    const digest = await treeDigest(TREE)

    await store.put(TREE)
    await files.apply([{ kind: 'write', path: `store/${digest}/src/a.ts`, content: bytes('changed'), executable: false }])

    expect(await store.get(digest)).toEqual({ kind: 'missing' })
  })

  it('returns the failure as data when the files port refuses to write under the root', async () => {
    const { store } = storeOn(memoryFilesOver({ entries: [{ path: 'store', kind: 'file', content: '', executable: false }] }))

    expect(await store.put(TREE)).toEqual({ kind: 'failed', reason: 'not-a-directory' })
  })
})
