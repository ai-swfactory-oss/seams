export { contentIntegrity, treeDigest } from './domain/digest'
export { type TreeOfEntries, treeOfEntries } from './domain/entries'
export { escapeGlob } from './domain/glob'
export { changesFromJson, changesToJson, parseChangesJson, parseTreeJson, treeFromJson, treeToJson } from './domain/json'
export { comparePaths, joinPath, normalisePath } from './domain/path'
export type {
  Change,
  ChangeFailure,
  ChangeJson,
  ChangeOutcome,
  CheckedTree,
  DirectoryEntry,
  DuplicatePath,
  FileEntry,
  Files,
  NonEmptyDirectory,
  PipeEntry,
  Selection,
  SymlinkEntry,
  Tree,
  TreeEntry,
  TreeEntryJson,
  TreeJson,
  WriteLineOutcome,
} from './types'
