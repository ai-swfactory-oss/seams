import type { MemoryRandomState, RandomPort } from '../index'

export interface GenerateMemoryRandomStatePorts {
  readonly ports: { readonly random: RandomPort }
}

export const generateMemoryRandomState = (_data: Record<never, never>, { ports }: GenerateMemoryRandomStatePorts): MemoryRandomState => {
  const [first = 0, second = 0, third = 0, fourth = 0] = ports.random.bytes(4)
  return { seed: (first | (second << 8) | (third << 16) | (fourth << 24)) >>> 0 }
}
