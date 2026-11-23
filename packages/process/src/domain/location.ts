import type { CheckedLocation, Location } from '../types'

const PLATFORMS: readonly string[] = ['aix', 'android', 'darwin', 'freebsd', 'linux', 'netbsd', 'openbsd', 'sunos', 'win32']
const ARCHES: readonly string[] = ['arm', 'arm64', 'ia32', 'loong64', 'mips', 'mipsel', 'ppc', 'ppc64', 'riscv64', 's390', 's390x', 'x64']
const LIBCS: readonly string[] = ['glibc', 'musl']

const ANCHOR = /^[A-Za-z][A-Za-z0-9+.-]*:/
const VARIABLE = /^[A-Za-z_][A-Za-z0-9_]*$/

const isTargetKey = (key: string): boolean => {
  const [platform, arch, libc, ...rest] = key.split('-')
  if (platform === undefined || arch === undefined || rest.length > 0) return false
  if (!PLATFORMS.includes(platform) || !ARCHES.includes(arch)) return false
  return libc === undefined || LIBCS.includes(libc)
}

const isSegment = (segment: string): boolean => segment !== '' && segment !== '.' && segment !== '..'

const isInsidePath = (path: string): boolean => !path.includes('\\') && path.split('/').every(isSegment)

const isPackageSubpath = (specifier: string): boolean => {
  if (!isInsidePath(specifier)) return false
  const segments = specifier.split('/')
  const [first, second] = segments
  if (first === undefined) return false
  const scoped = first.startsWith('@')
  if (scoped && (first.length === 1 || second === undefined || second.startsWith('@'))) return false
  return segments.length > (scoped ? 2 : 1)
}

const isAnchor = (value: unknown): value is string => typeof value === 'string' && ANCHOR.test(value)

const hasExactly = (value: object, keys: readonly string[]): boolean => {
  const own = Object.keys(value)
  return own.length === keys.length && keys.every(key => own.includes(key))
}

const stringEntries = (value: unknown): (readonly [string, string])[] | undefined => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const entries: (readonly [string, string])[] = []
  for (const [key, text] of Object.entries(value)) {
    if (typeof text !== 'string') return undefined
    entries.push([key, text])
  }
  return entries
}

const rendered = (value: unknown): string => (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value))

export const checkLocation = (value: unknown): CheckedLocation => {
  const refused: CheckedLocation = { kind: 'unknown-location', location: rendered(value) }
  if (typeof value === 'string') return isInsidePath(value) ? { kind: 'location', location: value } : refused
  if (typeof value !== 'object' || value === null || !('anchor' in value) || !isAnchor(value.anchor)) return refused
  const { anchor } = value
  if ('module' in value && hasExactly(value, ['anchor', 'module'])) {
    const { module } = value
    return typeof module === 'string' && isPackageSubpath(module) ? { kind: 'location', location: { anchor, module } } : refused
  }
  if (!('targets' in value) || !('env' in value) || !hasExactly(value, ['anchor', 'targets', 'env'])) return refused
  const targets = stringEntries(value.targets)
  const env = stringEntries(value.env)
  if (targets === undefined || env === undefined) return refused
  const badKey = targets.find(([key]) => !isTargetKey(key))
  if (badKey !== undefined) return { kind: 'unknown-target', target: badKey[0] }
  if (!targets.every(([, specifier]) => isPackageSubpath(specifier))) return refused
  if (!env.every(([name, path]) => VARIABLE.test(name) && isInsidePath(path))) return refused
  const location: Location = { anchor, targets: Object.fromEntries(targets), env: Object.fromEntries(env) }
  return { kind: 'location', location }
}
