import { type Tree, treeDigest } from '@ai-swfactory-oss/files'
import { describe, expect, it } from 'vitest'

import { contentStoreAt } from './content-store-at'
import { memoryFilesOver } from './memory-files'

const EMPTY: Tree = { entries: [] }

const store = () => contentStoreAt('store', memoryFilesOver({ entries: [] }))

describe('an empty tree on memory files', () => {
  it('is put under its digest', async () => {
    expect(await store().put(EMPTY)).toEqual({ kind: 'stored', digest: await treeDigest(EMPTY) })
  })

  it('is got back empty by that digest', async () => {
    const empty = store()
    const digest = await treeDigest(EMPTY)

    await empty.put(EMPTY)

    expect(await empty.get(digest)).toEqual({ kind: 'tree', tree: EMPTY })
  })
})
