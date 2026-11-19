export interface FileEntry {
  readonly path: string
  readonly kind: 'file'
  readonly content: Uint8Array
  readonly executable: boolean
}

export interface SymlinkEntry {
  readonly path: string
  readonly kind: 'symlink'
  readonly target: string
}

export interface DirectoryEntry {
  readonly path: string
  readonly kind: 'directory'
}

export type TreeEntry = FileEntry | SymlinkEntry | DirectoryEntry

export interface Tree {
  readonly entries: readonly TreeEntry[]
}

export interface NonEmptyDirectory {
  readonly kind: 'non-empty-directory'
  readonly path: string
}

export type CheckedTree = { readonly kind: 'tree'; readonly tree: Tree } | NonEmptyDirectory

export interface Selection {
  readonly root: string
  readonly include: readonly string[]
  readonly exclude: readonly string[]
}

export type Change =
  | { readonly kind: 'write'; readonly path: string; readonly content: Uint8Array; readonly executable: boolean }
  | { readonly kind: 'symlink'; readonly path: string; readonly target: string }
  | { readonly kind: 'delete'; readonly path: string }
  | { readonly kind: 'move'; readonly from: string; readonly to: string }
  | { readonly kind: 'mkdir'; readonly path: string }

export type ChangeFailure = 'invalid-path' | 'not-found' | 'not-a-directory' | 'is-a-directory' | 'exists' | 'permission-denied'

export type ChangeOutcome =
  | { readonly kind: 'applied' }
  | { readonly kind: 'failed'; readonly reason: ChangeFailure }
  | { readonly kind: 'skipped' }

export interface Files {
  readonly snapshot: (selection: Selection) => Promise<Tree>
  readonly apply: (changes: readonly Change[]) => Promise<readonly ChangeOutcome[]>
}

export type TreeEntryJson =
  | { readonly path: string; readonly kind: 'file'; readonly content: string; readonly executable: boolean }
  | SymlinkEntry
  | DirectoryEntry

export interface TreeJson {
  readonly entries: readonly TreeEntryJson[]
}

export type ChangeJson =
  | { readonly kind: 'write'; readonly path: string; readonly content: string; readonly executable: boolean }
  | Exclude<Change, { readonly kind: 'write' }>
