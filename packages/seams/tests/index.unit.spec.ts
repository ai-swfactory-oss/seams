import { describe, expect, it } from 'vitest'

import { createSeams } from '../src/index'
import { createFakeSeams } from '../src/testing/index'

describe('createSeams', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeams().describe()).toEqual({ name: '@ai-swfactory-oss/seams' })
  })
})

describe('createFakeSeams', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeams(description).describe()).toBe(description)
  })
})
