import * as published from '@ai-swfactory-oss/ids'
import { describe, expect, it } from 'vitest'

describe('the published ids entry', () => {
  it('exports createIdsSdk and no createIds', () => {
    expect([typeof published.createIdsSdk, Object.keys(published).sort()]).toEqual(['function', ['createIdsSdk']])
  })
})
