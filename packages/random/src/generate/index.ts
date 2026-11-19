import { parseRandomState } from '../domain/state'
import type { Random, RandomState } from '../types'

export interface RandomGeneration {
  readonly drawn: number
}

export interface RandomPorts {
  readonly random: Random
}

const SEED_BYTES = 4

const seedOf = (bytes: Uint8Array): number => bytes.reduce((seed, byte) => seed * 256 + byte, 0)

export const generateRandomState = (call: RandomGeneration, ports: RandomPorts): RandomState | undefined =>
  parseRandomState({ seed: seedOf(ports.random.bytes(SEED_BYTES)), drawn: call.drawn })
