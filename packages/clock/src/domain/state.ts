import type { ClockState } from '../types'

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const parseClockState = (value: unknown): ClockState | undefined => {
  if (!isRecord(value)) return undefined
  const now = value.now
  if (typeof now !== 'number' || !Number.isFinite(now)) return undefined
  return { now }
}
