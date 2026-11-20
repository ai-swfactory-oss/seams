import { describe, expect, it } from 'vitest'

import { createContentStoreSdk } from '../src/index'
import { memoryFilesOver } from './memory-files'

describe('creating a content store on memory files', () => {
  it.each(['../x', '/abs'])('refuses the root %s as data naming that root', root => {
    const files = memoryFilesOver({ entries: [] })

    expect(createContentStoreSdk({ root }, { files })).toEqual({ kind: 'refused', reason: 'invalid-root', root })
  })

  it('gives a store for a valid root', () => {
    const files = memoryFilesOver({ entries: [] })

    expect(Object.keys(createContentStoreSdk({ root: 'store' }, { files })).sort()).toEqual(['get', 'put'])
  })
})
