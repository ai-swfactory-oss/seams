import * as published from '@ai-swfactory-oss/logging'
import { describe, expect, it } from 'vitest'

describe('the published logging entry', () => {
  it('exports createLoggingSdk and no createLogging', () => {
    expect([typeof published.createLoggingSdk, Object.keys(published).sort()]).toEqual([
      'function',
      ['createLoggingSdk', 'formatRecord', 'lineStyleOf'],
    ])
  })
})
