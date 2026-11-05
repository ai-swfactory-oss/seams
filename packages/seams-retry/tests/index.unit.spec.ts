import { describe, expect, it } from 'vitest'

import { createSeamsRetry } from '../src/index'
import { createFakeSeamsRetry } from '../src/testing/index'

describe('createSeamsRetry', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsRetry().describe()).toEqual({ name: '@ai-swfactory-oss/seams-retry' })
  })
})

describe('createFakeSeamsRetry', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsRetry(description).describe()).toBe(description)
  })
})
