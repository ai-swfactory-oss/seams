import { formatRecord, lineStyleOf } from './domain/line'
import type { Logging, LoggingData, LoggingPorts } from './types'

export const createLogging = (data: LoggingData, { ports }: { readonly ports: LoggingPorts }): Logging => {
  const style = lineStyleOf(data.facts)
  return {
    log: record => ports.terminal.write('stderr', formatRecord(record, style)),
  }
}
