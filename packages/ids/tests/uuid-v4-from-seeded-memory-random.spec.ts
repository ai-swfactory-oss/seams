import { createMemoryRandom } from '@ai-swfactory-oss/random/memory'
import { describe, expect, it } from 'vitest'

import { createIdsSdk } from '../src/index'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

const uuids = (seed: number, count: number): string[] => {
  const ids = createIdsSdk({}, { random: createMemoryRandom({ seed, drawn: 0 }) })
  return Array.from({ length: count }, () => ids.uuid())
}

const hex = (bytes: readonly number[]): string => bytes.map(byte => byte.toString(16).padStart(2, '0')).join('')

describe('a v4 UUID from the seeded memory random', () => {
  it('is a version 4, variant 1 UUID in its canonical form', () => {
    for (const id of uuids(7, 64)) expect(id).toMatch(UUID_V4)
  })

  it('gives the same UUIDs for the same seed', () => {
    expect(uuids(7, 4)).toEqual(uuids(7, 4))
  })

  it('gives different UUIDs for a different seed', () => {
    expect(uuids(7, 4)).not.toEqual(uuids(8, 4))
  })

  it('gives a new UUID on every call', () => {
    expect(new Set(uuids(7, 64)).size).toBe(64)
  })

  it('draws sixteen bytes from the random port for each UUID', () => {
    const random = createMemoryRandom({ seed: 7, drawn: 0 })
    const ids = createIdsSdk({}, { random })

    ids.uuid()
    ids.uuid()

    expect(random.state()).toEqual({ seed: 7, drawn: 32 })
  })

  it('keeps the drawn bytes, setting only the version and variant bits', () => {
    const bytes = [...createMemoryRandom({ seed: 7, drawn: 0 }).bytes(16)]
    const [id] = uuids(7, 1)

    const version = ((bytes[6] ?? 0) & 0x0f) | 0x40
    const variant = ((bytes[8] ?? 0) & 0x3f) | 0x80
    const expected = hex([...bytes.slice(0, 6), version, bytes[7] ?? 0, variant, ...bytes.slice(9)])

    expect(id?.replaceAll('-', '')).toBe(expected)
  })
})
