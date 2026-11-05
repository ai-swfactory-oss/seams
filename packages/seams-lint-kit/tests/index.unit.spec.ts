import { describe, expect, it } from 'vitest'

import { createSeamsLintKit } from '../src/index'
import { createFakeSeamsLintKit } from '../src/testing/index'

describe('createSeamsLintKit', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsLintKit().describe()).toEqual({ name: '@ai-swfactory-oss/seams-lint-kit' })
  })
})

describe('createFakeSeamsLintKit', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsLintKit(description).describe()).toBe(description)
  })
})
