import type { HostFacts } from '@ai-swfactory-oss/host'

export type CaptureMode = 'in-place' | 'overlay'

export const captureFor = (facts: HostFacts): CaptureMode => (facts.os === 'linux' ? 'overlay' : 'in-place')
