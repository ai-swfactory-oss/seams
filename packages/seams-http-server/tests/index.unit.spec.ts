import { describe, expect, it } from 'vitest'

import { createSeamsHttpServer } from '../src/index'
import { createFakeSeamsHttpServer } from '../src/testing/index'

describe('createSeamsHttpServer', () => {
  it('describes its own package while the package is a skeleton', () => {
    expect(createSeamsHttpServer().describe()).toEqual({
      name: '@ai-swfactory-oss/seams-http-server',
    })
  })
})

describe('createFakeSeamsHttpServer', () => {
  it('returns the description it was given', () => {
    const description = { name: 'fake' }
    expect(createFakeSeamsHttpServer(description).describe()).toBe(description)
  })
})
