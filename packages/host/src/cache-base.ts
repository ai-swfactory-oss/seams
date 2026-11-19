import type { HostFacts } from './facts'

const separatorOf = (facts: HostFacts): string => (facts.os === 'win32' ? '\\' : '/')

const setOrUndefined = (value: string | undefined): string | undefined => (value === undefined || value === '' ? undefined : value)

export const userCacheBase = (facts: HostFacts): string =>
  setOrUndefined(facts.env.XDG_CACHE_HOME) ?? setOrUndefined(facts.env.LOCALAPPDATA) ?? `${facts.home}${separatorOf(facts)}.cache`
