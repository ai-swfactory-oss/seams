import { type Tree, treeDigest } from '@ai-swfactory-oss/files'
import { describe, expect, it } from 'vitest'

import { contentStoreAt } from './content-store-at'
import { memoryFilesOver } from './memory-files'

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

const STORABLE: Tree = {
  entries: [
    { path: 'a', kind: 'symlink', target: 'b/c' },
    { path: 'b/c', kind: 'file', content: bytes('c'), executable: false },
  ],
}

const PARENT_ENTRY: Tree = {
  entries: [{ path: '..', kind: 'file', content: bytes('escape'), executable: false }],
}

const storedPathsOf = (digest: string): readonly string[] => [`symlink store/${digest}/a`, `file store/${digest}/b/c`]

describe('a failed put leaves nothing a later put stumbles on', () => {
  it('refuses an entry at .. before writing anything, so the files hold no digest folder', async () => {
    const files = memoryFilesOver({ entries: [] })
    const store = contentStoreAt('store', files)

    expect(await store.put(PARENT_ENTRY)).toEqual({ kind: 'refused', reason: 'path-not-normal', path: '..' })
    expect(files.state().entries).toEqual([])
  })

  it('stores a storable tree after a refused put, and gets it back equal', async () => {
    const files = memoryFilesOver({ entries: [] })
    const store = contentStoreAt('store', files)
    const digest = await treeDigest(STORABLE)

    await store.put(PARENT_ENTRY)

    expect(await store.put(STORABLE)).toEqual({ kind: 'stored', digest })
    expect(await store.get(digest)).toEqual({ kind: 'tree', tree: STORABLE })
  })

  it('clears a file left where a directory of the tree goes, then stores the tree and gets it back equal', async () => {
    const digest = await treeDigest(STORABLE)
    const files = memoryFilesOver({ entries: [{ path: `store/${digest}/b`, kind: 'file', content: 'Yg==', executable: false }] })
    const store = contentStoreAt('store', files)

    expect(await store.put(STORABLE)).toEqual({ kind: 'stored', digest })
    expect(await store.get(digest)).toEqual({ kind: 'tree', tree: STORABLE })
    expect(files.state().entries.map(entry => `${entry.kind} ${entry.path}`)).toEqual(storedPathsOf(digest))
  })

  it('clears a digest folder a put left part-way, then stores the tree and gets it back equal', async () => {
    const digest = await treeDigest(STORABLE)
    const files = memoryFilesOver({ entries: [{ path: `store/${digest}/a`, kind: 'symlink', target: 'b/c' }] })
    const store = contentStoreAt('store', files)

    expect(await store.get(digest)).toEqual({ kind: 'missing' })
    expect(await store.put(STORABLE)).toEqual({ kind: 'stored', digest })
    expect(await store.get(digest)).toEqual({ kind: 'tree', tree: STORABLE })
    expect(files.state().entries.map(entry => `${entry.kind} ${entry.path}`)).toEqual(storedPathsOf(digest))
  })
})
