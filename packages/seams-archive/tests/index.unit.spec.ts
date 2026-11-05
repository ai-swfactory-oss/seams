import { describe, expect, it } from 'vitest'

import { createSeamsArchive } from '../src/index'
import { createFakeSeamsArchive } from '../src/testing/index'

describe('createSeamsArchive', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsArchive().describe()).toEqual({ name: '@ai-swfactory-oss/seams-archive' })
  })
})

describe('createFakeSeamsArchive', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsArchive(description).describe()).toBe(description)
  })
})
