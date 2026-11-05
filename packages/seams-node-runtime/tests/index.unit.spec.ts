import { describe, expect, it } from 'vitest'

import { createSeamsNodeRuntime } from '../src/index'
import { createFakeSeamsNodeRuntime } from '../src/testing/index'

describe('createSeamsNodeRuntime', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsNodeRuntime().describe()).toEqual({
      name: '@ai-swfactory-oss/seams-node-runtime',
    })
  })
})

describe('createFakeSeamsNodeRuntime', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsNodeRuntime(description).describe()).toBe(description)
  })
})
