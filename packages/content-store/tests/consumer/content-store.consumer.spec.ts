import * as published from '@ai-swfactory-oss/content-store'
import { describe, expect, it } from 'vitest'

describe('the published content-store entry', () => {
  it('exports createContentStoreSdk and no createContentStore', () => {
    expect([typeof published.createContentStoreSdk, Object.keys(published).sort()]).toEqual(['function', ['createContentStoreSdk']])
  })
})
