import { formatRecord, lineStyleOf } from './domain/line'
import type { Logging, LoggingData, LoggingPorts } from './types'

export const createLoggingSdk = (data: LoggingData, { terminal }: LoggingPorts): Logging => {
  const style = lineStyleOf(data.facts)
  return {
    log: record => terminal.write('stderr', formatRecord(record, style)),
  }
}
