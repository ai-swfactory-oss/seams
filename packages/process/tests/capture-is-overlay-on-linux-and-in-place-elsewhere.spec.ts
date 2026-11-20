import { describe, expect, it } from 'vitest'

import { captureFor } from '../src/index'

describe('captureFor', () => {
  it('captures through an overlay on Linux', () => {
    expect([captureFor({ os: 'linux', arch: 'x64' }), captureFor({ os: 'linux', arch: 'arm64' })]).toEqual(['overlay', 'overlay'])
  })

  it('runs in place on macOS', () => {
    expect([captureFor({ os: 'darwin', arch: 'arm64' }), captureFor({ os: 'darwin', arch: 'x64' })]).toEqual(['in-place', 'in-place'])
  })
})
