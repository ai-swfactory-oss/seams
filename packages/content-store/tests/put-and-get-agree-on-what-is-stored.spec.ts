import { type Tree, treeDigest, type TreeEntryJson } from '@ai-swfactory-oss/files'
import { describe, expect, it } from 'vitest'

import type { ContentStore, Put } from '../src/index'
import { contentStoreAt } from './content-store-at'
import { memoryFilesOver } from './memory-files'

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

const EMPTY: Tree = { entries: [] }

const TREE: Tree = { entries: [{ path: 'a', kind: 'file', content: bytes('a'), executable: false }] }

const storeOn = (initial: readonly TreeEntryJson[] = []) => {
  const files = memoryFilesOver({ entries: initial })
  return { files, store: contentStoreAt('store', files) }
}

const agreement = async (store: ContentStore, tree: Tree): Promise<Put | string> => {
  const put = await store.put(tree)
  if (put.kind !== 'stored') return put
  const got = await store.get(put.digest)
  return got.kind === 'tree' && JSON.stringify(got.tree) === JSON.stringify(tree)
    ? 'stored and got back equal'
    : `stored but got ${got.kind}`
}

describe('put and get agree on what is stored', () => {
  it('refuses a tree with an entry path not in normal form, and writes nothing', async () => {
    const { files, store } = storeOn()

    const agreed = await agreement(store, { entries: [{ path: '/x', kind: 'file', content: bytes('x'), executable: false }] })

    expect([agreed, files.state()]).toEqual([{ kind: 'refused', reason: 'path-not-normal', path: '/x' }, { entries: [] }])
  })

  it('refuses a tree with a duplicate path', async () => {
    const { store } = storeOn()

    expect(
      await agreement(store, {
        entries: [
          { path: 'a', kind: 'file', content: bytes('one'), executable: false },
          { path: 'a', kind: 'file', content: bytes('two'), executable: false },
        ],
      }),
    ).toEqual({ kind: 'refused', reason: 'duplicate-path', path: 'a' })
  })

  it('refuses a tree whose entries are not in path order', async () => {
    const { store } = storeOn()

    expect(
      await agreement(store, {
        entries: [
          { path: 'b', kind: 'file', content: bytes('b'), executable: false },
          { path: 'a', kind: 'file', content: bytes('a'), executable: false },
        ],
      }),
    ).toEqual({ kind: 'refused', reason: 'out-of-order', path: 'a' })
  })

  it('refuses a tree with a directory entry that has entries beneath it', async () => {
    const { store } = storeOn()

    expect(
      await agreement(store, {
        entries: [
          { path: 'd', kind: 'directory' },
          { path: 'd/a', kind: 'file', content: bytes('a'), executable: false },
        ],
      }),
    ).toEqual({ kind: 'refused', reason: 'non-empty-directory', path: 'd' })
  })

  it('refuses a tree with an entry beneath a file', async () => {
    const { store } = storeOn()

    expect(
      await agreement(store, {
        entries: [
          { path: 'f', kind: 'file', content: bytes('f'), executable: false },
          { path: 'f/a', kind: 'file', content: bytes('a'), executable: false },
        ],
      }),
    ).toEqual({ kind: 'refused', reason: 'not-a-directory', path: 'f' })
  })

  it('stores a tree whose digest folder already holds an extra file, and gets it back equal', async () => {
    const digest = await treeDigest(TREE)
    const { store } = storeOn([{ path: `store/${digest}/extra`, kind: 'file', content: 'ZXh0cmE=', executable: false }])

    expect(await agreement(store, TREE)).toBe('stored and got back equal')
  })

  it('does not get an empty tree from a file at its digest, and put makes the digest folder', async () => {
    const digest = await treeDigest(EMPTY)
    const { files, store } = storeOn([{ path: `store/${digest}`, kind: 'file', content: '', executable: false }])

    const before = await store.get(digest)
    const agreed = await agreement(store, EMPTY)

    expect([before, agreed, files.state().entries]).toEqual([
      { kind: 'missing' },
      'stored and got back equal',
      [{ path: `store/${digest}`, kind: 'directory' }],
    ])
  })

  it('does not get an empty tree from a symlink at its digest, and put makes the digest folder', async () => {
    const digest = await treeDigest(EMPTY)
    const { files, store } = storeOn([{ path: `store/${digest}`, kind: 'symlink', target: 'elsewhere' }])

    const before = await store.get(digest)
    const agreed = await agreement(store, EMPTY)

    expect([before, agreed, files.state().entries]).toEqual([
      { kind: 'missing' },
      'stored and got back equal',
      [{ path: `store/${digest}`, kind: 'directory' }],
    ])
  })
})
