import type { RandomState } from '../types'

export const parseRandomState = (value: unknown): RandomState | undefined => {
  if (typeof value !== 'object' || value === null || !('seed' in value) || !('drawn' in value)) return undefined
  const { seed, drawn } = value
  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) return undefined
  if (typeof drawn !== 'number' || !Number.isInteger(drawn) || drawn < 0) return undefined
  return { seed, drawn }
}
