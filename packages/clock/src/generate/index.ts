import type { Clock, ClockState } from '../types'

export interface ClockPorts {
  readonly clock: Clock
}

export const generateClockState = ({ ports }: { readonly ports: ClockPorts }): ClockState => ({
  now: ports.clock.now(),
})
