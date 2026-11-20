import * as published from '@ai-swfactory-oss/retry'
import { describe, expect, it } from 'vitest'

describe('the published retry entry', () => {
  it('exports createRetrySdk and no createRetry', () => {
    expect([typeof published.createRetrySdk, Object.keys(published).sort()]).toEqual([
      'function',
      ['CONDITION_NOT_HELD', 'InvalidPolicyError', 'createRetrySdk', 'nextCheck', 'nextStep'],
    ])
  })
})
