import { describe, expect, it } from 'vitest'

import { type HostFacts, userCacheBase } from '../src/index'

const facts = (overrides: Partial<HostFacts>): HostFacts => ({
  env: {},
  os: 'linux',
  arch: 'x64',
  home: '/home/ada',
  tty: { stdin: false, stdout: false, stderr: false, columns: undefined },
  timeZone: 'UTC',
  locale: 'en-US',
  ...overrides,
})

describe('userCacheBase', () => {
  it('is XDG_CACHE_HOME when it is set, before LOCALAPPDATA', () => {
    expect(userCacheBase(facts({ env: { XDG_CACHE_HOME: '/var/cache/ada', LOCALAPPDATA: '/local' } }))).toBe('/var/cache/ada')
  })

  it('falls through an empty XDG_CACHE_HOME to LOCALAPPDATA, as if it were unset', () => {
    expect(userCacheBase(facts({ env: { XDG_CACHE_HOME: '', LOCALAPPDATA: '/local' } }))).toBe('/local')
  })

  it('is LOCALAPPDATA when XDG_CACHE_HOME is not set', () => {
    expect(userCacheBase(facts({ os: 'win32', home: 'C:\\Users\\ada', env: { LOCALAPPDATA: 'C:\\Users\\ada\\AppData\\Local' } }))).toBe(
      'C:\\Users\\ada\\AppData\\Local',
    )
  })

  it('is .cache in the home directory when neither is set, on every OS', () => {
    const unset: HostFacts['env'] = {}
    const empty: HostFacts['env'] = { XDG_CACHE_HOME: '', LOCALAPPDATA: '' }

    expect([
      userCacheBase(facts({ env: unset })),
      userCacheBase(facts({ env: empty })),
      userCacheBase(facts({ os: 'darwin', home: '/Users/ada' })),
      userCacheBase(facts({ os: 'win32', home: 'C:\\Users\\ada' })),
    ]).toEqual(['/home/ada/.cache', '/home/ada/.cache', '/Users/ada/.cache', 'C:\\Users\\ada\\.cache'])
  })
})
