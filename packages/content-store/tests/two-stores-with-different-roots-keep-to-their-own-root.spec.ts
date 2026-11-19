import { type Tree, treeDigest } from '@ai-swfactory-oss/files'
import { describe, expect, it } from 'vitest'

import { contentStoreAt } from './content-store-at'
import { memoryFilesOver } from './memory-files'

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text)

const ONE: Tree = { entries: [{ path: 'one.txt', kind: 'file', content: bytes('one'), executable: false }] }
const TWO: Tree = { entries: [{ path: 'two.txt', kind: 'file', content: bytes('two'), executable: false }] }

const twoStores = () => {
  const files = memoryFilesOver({ entries: [] })
  return {
    files,
    first: contentStoreAt('first/store', files),
    second: contentStoreAt('second/store', files),
  }
}

describe('two stores with different roots on one memory files', () => {
  it('write only under their own root', async () => {
    const { files, first, second } = twoStores()

    await first.put(ONE)
    await second.put(TWO)

    expect(files.state().entries.map(entry => entry.path)).toEqual([
      `first/store/${await treeDigest(ONE)}/one.txt`,
      `second/store/${await treeDigest(TWO)}/two.txt`,
    ])
  })

  it('each read back only what it put', async () => {
    const { first, second } = twoStores()
    const one = await treeDigest(ONE)
    const two = await treeDigest(TWO)

    await first.put(ONE)
    await second.put(TWO)

    expect(await Promise.all([first.get(one), first.get(two), second.get(two), second.get(one)])).toEqual([
      { kind: 'tree', tree: ONE },
      { kind: 'missing' },
      { kind: 'tree', tree: TWO },
      { kind: 'missing' },
    ])
  })
})
