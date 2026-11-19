import type { HostFacts } from '@ai-swfactory-oss/host'
import { describe, expect, it } from 'vitest'

import { captureFor } from '../src/index'

const facts = (overrides: Partial<HostFacts>): HostFacts => ({
  env: {},
  os: 'linux',
  arch: 'x64',
  home: '/home/ada',
  tty: { stdin: false, stdout: false, stderr: false, columns: undefined },
  timeZone: 'UTC',
  locale: 'en-US',
  ...overrides,
})

describe('captureFor', () => {
  it('captures through an overlay on Linux', () => {
    expect([captureFor(facts({ os: 'linux', arch: 'x64' })), captureFor(facts({ os: 'linux', arch: 'arm64' }))]).toEqual([
      'overlay',
      'overlay',
    ])
  })

  it('runs in place on macOS', () => {
    expect([captureFor(facts({ os: 'darwin', arch: 'arm64' })), captureFor(facts({ os: 'darwin', arch: 'x64' }))]).toEqual([
      'in-place',
      'in-place',
    ])
  })
})
