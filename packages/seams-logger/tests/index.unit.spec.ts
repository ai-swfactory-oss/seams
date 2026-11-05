import { describe, expect, it } from 'vitest'

import { createSeamsLogger } from '../src/index'
import { createFakeSeamsLogger } from '../src/testing/index'

describe('createSeamsLogger', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsLogger().describe()).toEqual({ name: '@ai-swfactory-oss/seams-logger' })
  })
})

describe('createFakeSeamsLogger', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsLogger(description).describe()).toBe(description)
  })
})
