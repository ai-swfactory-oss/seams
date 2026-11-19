import { changesFromJson, treeFromJson, treeToJson } from '../domain/json'
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
  const setup = treeFromJson(call.setup)
  const changes = changesFromJson(call.changes)
  const { files } = ports
  await files.apply(writesOf(setup))
  const snapshot = await files.snapshot(call.selection)
  const outcomes = await files.apply(changes)
  const after = await files.snapshot(call.selection)
  return { setup: call.setup, snapshot: treeToJson(snapshot), outcomes, after: treeToJson(after) }
}
