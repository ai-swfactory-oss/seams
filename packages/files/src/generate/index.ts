import { changesFromJson, treeFromJson, treeToJson } from '../domain/json'
import { NonEmptyDirectoryError } from '../domain/non-empty-directory'
import type { Change, ChangeJson, ChangeOutcome, Files, Selection, Tree, TreeJson } from '../types'

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

const writesOf = (tree: Tree): Change[] =>
  tree.entries.map(entry =>
    entry.kind === 'file'
      ? { kind: 'write', path: entry.path, content: entry.content, executable: entry.executable }
      : entry.kind === 'symlink'
        ? { kind: 'symlink', path: entry.path, target: entry.target }
        : { kind: 'mkdir', path: entry.path },
  )

export const generateFilesResults = async (call: FilesGeneration, ports: { readonly files: Files }): Promise<FilesResults> => {
  const checked = treeFromJson(call.setup)
  if (checked.kind === 'non-empty-directory') throw new NonEmptyDirectoryError('generateFilesResults', 'the setup', checked.path)
  const setup = checked.tree
  const changes = changesFromJson(call.changes)
  const { files } = ports
  await files.apply(writesOf(setup))
  const snapshot = await files.snapshot(call.selection)
  const outcomes = await files.apply(changes)
  const after = await files.snapshot(call.selection)
  return { setup: call.setup, snapshot: treeToJson(snapshot), outcomes, after: treeToJson(after) }
}
