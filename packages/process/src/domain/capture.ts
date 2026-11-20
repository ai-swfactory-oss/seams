export interface HostFacts {
  readonly os: string
  readonly arch: string
}

export type CaptureMode = 'in-place' | 'overlay'

export const captureFor = (facts: HostFacts): CaptureMode => (facts.os === 'linux' ? 'overlay' : 'in-place')
