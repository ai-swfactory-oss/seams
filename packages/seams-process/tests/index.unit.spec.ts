import { describe, expect, it } from 'vitest'

import { createSeamsProcess } from '../src/index'
import { createFakeSeamsProcess } from '../src/testing/index'

describe('createSeamsProcess', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsProcess().describe()).toEqual({ name: '@ai-swfactory-oss/seams-process' })
  })
})

describe('createFakeSeamsProcess', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsProcess(description).describe()).toBe(description)
  })
})
