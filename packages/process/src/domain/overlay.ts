import { type Change, comparePaths, type Tree, type TreeEntry } from '@ai-swfactory-oss/files'

export type UpperEntry =
  | { readonly path: string; readonly kind: 'file'; readonly content: Uint8Array; readonly executable: boolean }
  | { readonly path: string; readonly kind: 'symlink'; readonly target: string }
  | { readonly path: string; readonly kind: 'directory'; readonly opaque: boolean }
  | { readonly path: string; readonly kind: 'whiteout' }

export type ApplyStep = Change | { readonly kind: 'move-from-upper'; readonly path: string }

type LowerAt = TreeEntry | undefined

const parentsOf = (path: string): string[] => {
  const segments = path.split('/')
  return segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('/'))
}

const isWithin = (path: string, directory: string): boolean => path === directory || path.startsWith(`${directory}/`)

const sameBytes = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && a.every((byte, index) => byte === b[index])

const hidesLower = (entry: UpperEntry | undefined): boolean => (entry === undefined ? false : entry.kind !== 'directory' || entry.opaque)

const lowerView = (upper: readonly UpperEntry[], lower: Tree): ((path: string) => LowerAt) => {
  const entries = new Map(lower.entries.map(entry => [entry.path, entry]))
  const directories = new Set(lower.entries.flatMap(entry => parentsOf(entry.path)))
  const upperAt = new Map(upper.map(entry => [entry.path, entry]))
  return path => {
    if (parentsOf(path).some(parent => hidesLower(upperAt.get(parent)))) return undefined
    return entries.get(path) ?? (directories.has(path) ? { path, kind: 'directory' } : undefined)
  }
}

const replacing = (existing: LowerAt, change: Change & { readonly path: string }): Change[] =>
  existing === undefined ? [change] : [{ kind: 'delete', path: change.path }, change]

const leafChanges = (entry: Exclude<UpperEntry, { readonly kind: 'directory' }>, existing: LowerAt): Change[] => {
  switch (entry.kind) {
    case 'whiteout':
      return existing === undefined ? [] : [{ kind: 'delete', path: entry.path }]
    case 'file':
      if (existing?.kind === 'file' && existing.executable === entry.executable && sameBytes(existing.content, entry.content)) return []
      return replacing(existing?.kind === 'file' ? undefined : existing, {
        kind: 'write',
        path: entry.path,
        content: entry.content,
        executable: entry.executable,
      })
    case 'symlink':
      if (existing?.kind === 'symlink' && existing.target === entry.target) return []
      return replacing(existing, { kind: 'symlink', path: entry.path, target: entry.target })
  }
}

const directoryIsNew = (entry: { readonly opaque: boolean }, existing: LowerAt): boolean => existing?.kind !== 'directory' || entry.opaque

const sortedByPath = (upper: readonly UpperEntry[]): UpperEntry[] => [...upper].sort((a, b) => comparePaths(a.path, b.path))

export const changesFromUpper = (upper: readonly UpperEntry[], lower: Tree): Change[] => {
  const lowerAt = lowerView(upper, lower)
  return sortedByPath(upper).flatMap((entry): Change[] => {
    const existing = lowerAt(entry.path)
    if (entry.kind !== 'directory') return leafChanges(entry, existing)
    return directoryIsNew(entry, existing) ? replacing(existing, { kind: 'mkdir', path: entry.path }) : []
  })
}

export const applyBackPlan = (upper: readonly UpperEntry[], lower: Tree): ApplyStep[] => {
  const lowerAt = lowerView(upper, lower)
  const moved: string[] = []
  const steps: ApplyStep[] = []
  for (const entry of sortedByPath(upper)) {
    if (moved.some(directory => isWithin(entry.path, directory))) continue
    const existing = lowerAt(entry.path)
    if (entry.kind !== 'directory') {
      steps.push(...leafChanges(entry, existing))
    } else if (directoryIsNew(entry, existing)) {
      if (existing !== undefined) steps.push({ kind: 'delete', path: entry.path })
      steps.push({ kind: 'move-from-upper', path: entry.path })
      moved.push(entry.path)
    }
  }
  return steps
}
