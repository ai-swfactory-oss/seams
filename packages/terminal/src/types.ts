export type TerminalStream = 'stdout' | 'stderr'

export type WriteOutcome = { readonly kind: 'written' } | { readonly kind: 'closed' }

export interface Terminal {
  readonly write: (stream: TerminalStream, text: string) => Promise<WriteOutcome>

  readonly readLine: () => Promise<string | undefined>

  readonly readAll: () => Promise<string>
}

export interface TerminalWrite {
  readonly stream: TerminalStream
  readonly text: string
}

export interface TerminalState {
  readonly input: string
  readonly output: readonly TerminalWrite[]
  readonly closed: readonly TerminalStream[]
}
