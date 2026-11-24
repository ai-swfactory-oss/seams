import { changesFromJson, treeFromJson, treeToJson } from '../domain/json'
import type {
  Change,
  ChangeJson,
  ChangeOutcome,
  DuplicatePath,
  FailedChange,
  Files,
  NonEmptyDirectory,
  Selection,
  Tree,
  TreeEntry,
  TreeJson,
} from '../types'

export interface FilesGeneration {
  readonly setup: TreeJson
  readonly selection: Selection
  readonly changes: readonly ChangeJson[]
}

export interface FilesResults {
  readonly setup: TreeJson
  readonly snapshot: TreeJson
  readonly outcomes: readonly ChangeOutcome[]
  readonly after: TreeJson
}

export type GeneratedFilesResults =
  | { readonly kind: 'results'; readonly results: FilesResults }
  | NonEmptyDirectory
  | DuplicatePath
  | FailedChange

const writeOf = (entry: TreeEntry): Change => {
  switch (entry.kind) {
    case 'file':
      return { kind: 'write', path: entry.path, content: entry.content, executable: entry.executable }
    case 'symlink':
      return { kind: 'symlink', path: entry.path, target: entry.target }
    case 'pipe':
      return { kind: 'pipe', path: entry.path }
    case 'directory':
      return { kind: 'mkdir', path: entry.path }
  }
}

const writesOf = (tree: Tree): Change[] => tree.entries.map(writeOf)

export const generateFilesResults = async (call: FilesGeneration, ports: { readonly files: Files }): Promise<GeneratedFilesResults> => {
  const checked = treeFromJson(call.setup)
  if (checked.kind !== 'tree') return checked
  const setup = checked.tree
  const changes = changesFromJson(call.changes)
  const { files } = ports
  await files.apply(writesOf(setup))
  const snapshot = await files.snapshot(call.selection)
  if (snapshot.kind === 'failed') return snapshot
  const outcomes = await files.apply(changes)
  const after = await files.snapshot(call.selection)
  if (after.kind === 'failed') return after
  return {
    kind: 'results',
    results: { setup: call.setup, snapshot: treeToJson(snapshot.tree), outcomes, after: treeToJson(after.tree) },
  }
}
