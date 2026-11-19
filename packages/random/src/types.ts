export interface Random {
  readonly bytes: (count: number) => Uint8Array
}

export interface RandomState {
  readonly seed: number
  readonly drawn: number
}
