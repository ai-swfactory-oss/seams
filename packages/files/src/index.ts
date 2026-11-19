export { type TreeOfEntries, treeOfEntries } from './domain/entries'
export { escapeGlob } from './domain/glob'
export { changesFromJson, changesToJson, parseChangesJson, parseTreeJson, treeFromJson, treeToJson } from './domain/json'
export { comparePaths, joinPath, normalisePath } from './domain/path'
export type {
  Change,
  ChangeFailure,
  ChangeJson,
  ChangeOutcome,
  DirectoryEntry,
  FileEntry,
  Files,
  Selection,
  SymlinkEntry,
  Tree,
  TreeEntry,
  TreeEntryJson,
  TreeJson,
} from './types'
