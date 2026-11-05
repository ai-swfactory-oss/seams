import { describe, expect, it } from 'vitest'

import { createSeamsModule } from '../src/index'
import { createFakeSeamsModule } from '../src/testing/index'

describe('createSeamsModule', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsModule().describe()).toEqual({ name: '@ai-swfactory-oss/seams-module' })
  })
})

describe('createFakeSeamsModule', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsModule(description).describe()).toBe(description)
  })
})
