import { describe, expect, it } from 'vitest'

import { createSeamsHost } from '../src/index'
import { createFakeSeamsHost } from '../src/testing/index'

describe('createSeamsHost', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsHost().describe()).toEqual({ name: '@ai-swfactory-oss/seams-host' })
  })
})

describe('createFakeSeamsHost', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsHost(description).describe()).toBe(description)
  })
})
