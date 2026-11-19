import type { HostFacts } from '@ai-swfactory-oss/host'
import type { Terminal, WriteOutcome } from '@ai-swfactory-oss/terminal'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogFieldValue = string | number | boolean | null

export type LogFields = Readonly<Record<string, LogFieldValue>>

export interface LogRecord {
  readonly level: LogLevel
  readonly message: string
  readonly fields?: LogFields
}

export interface LineStyle {
  readonly colour: boolean
}

export interface LoggingData {
  readonly facts: Pick<HostFacts, 'env' | 'tty'>
}

export interface LoggingPorts {
  readonly terminal: Terminal
}

export interface Logging {
  readonly log: (record: LogRecord) => Promise<WriteOutcome>
}
