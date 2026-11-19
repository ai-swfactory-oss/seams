import type { LineStyle, LogFieldValue, LoggingData, LogLevel, LogRecord } from '../types'

const LABELS: Readonly<Record<LogLevel, string>> = { debug: 'DEBUG', info: 'INFO', warn: 'WARN', error: 'ERROR' }

const COLOURS: Readonly<Record<LogLevel, string>> = { debug: '\u001b[90m', info: '\u001b[36m', warn: '\u001b[33m', error: '\u001b[31m' }

const RESET_FOREGROUND = '\u001b[39m'

const BARE_VALUE = /^[^\s"=]+$/u

const LINE_BREAK = /\r\n|\r|\n/gu

export const lineStyleOf = (facts: LoggingData['facts']): LineStyle => {
  const noColour = facts.env.NO_COLOR
  return { colour: facts.tty.stderr && (noColour === undefined || noColour === '') }
}

const labelOf = (level: LogLevel, style: LineStyle): string =>
  style.colour ? `${COLOURS[level]}${LABELS[level]}${RESET_FOREGROUND}` : LABELS[level]

const valueOf = (value: LogFieldValue): string => {
  if (typeof value !== 'string') return String(value)
  return BARE_VALUE.test(value) ? value : JSON.stringify(value)
}

export const formatRecord = (record: LogRecord, style: LineStyle): string => {
  const fields = Object.entries(record.fields ?? {}).map(([key, value]) => ` ${key}=${valueOf(value)}`)
  return `${labelOf(record.level, style)} ${record.message.replace(LINE_BREAK, '\\n')}${fields.join('')}\n`
}
