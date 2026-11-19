import type { TerminalState, TerminalStream, TerminalWrite } from '../types'

const streamOf = (value: unknown): TerminalStream | undefined => (value === 'stdout' || value === 'stderr' ? value : undefined)

const writeOf = (value: unknown): TerminalWrite | undefined => {
  if (typeof value !== 'object' || value === null || !('stream' in value) || !('text' in value)) return undefined
  const stream = streamOf(value.stream)
  const { text } = value
  return stream === undefined || typeof text !== 'string' ? undefined : { stream, text }
}

const listOf = <T>(value: unknown, read: (item: unknown) => T | undefined): T[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const items: T[] = []
  for (const raw of value) {
    const item = read(raw)
    if (item === undefined) return undefined
    items.push(item)
  }
  return items
}

export const parseTerminalState = (value: unknown): TerminalState | undefined => {
  if (typeof value !== 'object' || value === null) return undefined
  if (!('input' in value) || !('output' in value) || !('closed' in value)) return undefined
  const { input } = value
  const output = listOf(value.output, writeOf)
  const closed = listOf(value.closed, streamOf)
  if (typeof input !== 'string' || output === undefined || closed === undefined) return undefined
  return { input, output, closed }
}
