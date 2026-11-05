import { describe, expect, it } from 'vitest'

import { createSeamsToolRunner } from '../src/index'
import { createFakeSeamsToolRunner } from '../src/testing/index'

describe('createSeamsToolRunner', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsToolRunner().describe()).toEqual({
      name: '@ai-swfactory-oss/seams-tool-runner',
    })
  })
})

describe('createFakeSeamsToolRunner', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsToolRunner(description).describe()).toBe(description)
  })
})
