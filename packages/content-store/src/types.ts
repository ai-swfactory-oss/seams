import type { ChangeFailure, Files, Tree } from '@ai-swfactory-oss/files'

export interface ContentStoreData {
  readonly root: string
}

export interface ContentStorePorts {
  readonly files: Files
}

export type Put = { readonly kind: 'stored'; readonly digest: string } | { readonly kind: 'failed'; readonly reason: ChangeFailure }

export type Got = { readonly kind: 'tree'; readonly tree: Tree } | { readonly kind: 'missing' }

export interface ContentStore {
  readonly put: (tree: Tree) => Promise<Put>
  readonly get: (digest: string) => Promise<Got>
}
