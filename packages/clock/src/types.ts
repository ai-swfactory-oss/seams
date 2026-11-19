export type Instant = number

export type Duration = number

export interface Clock {
  readonly now: () => Instant
  readonly wait: (duration: Duration) => Promise<void>
}

export interface ClockState {
  readonly now: Instant
}
