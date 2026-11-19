export interface RandomPort {
  readonly bytes: (n: number) => Uint8Array
}

export interface MemoryRandomState {
  readonly seed: number
}

export interface MemoryRandom extends RandomPort {
  readonly state: () => MemoryRandomState
}
