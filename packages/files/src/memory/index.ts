import { applyInOrder } from '../domain/apply'
import { treeFromJson, treeToJson } from '../domain/json'
import { normalisePath } from '../domain/path'
import { NO_LINES, pipeReaders } from '../domain/pipe-readers'
import { snapshotOf, stepOf, treeOfVolume, type Volume, volumeOf } from '../domain/volume'
import type { DuplicatePath, Files, NonEmptyDirectory, Tree, TreeJson } from '../types'

export interface MemoryFiles extends Files {
  readonly state: () => TreeJson
}

export type CreatedMemoryFiles = { readonly kind: 'files'; readonly files: MemoryFiles } | NonEmptyDirectory | DuplicatePath

const memoryFilesOf = (initial: Tree): MemoryFiles => {
  let volume: Volume = volumeOf(initial)
  const readers = pipeReaders()
  const pipeAt = (path: string): string | undefined => {
    const normalised = normalisePath(path)
    return normalised !== undefined && volume.get(normalised)?.kind === 'pipe' ? normalised : undefined
  }
  return {
    readLines: (path, { signal }) => {
      const pipe = pipeAt(path)
      return pipe === undefined ? NO_LINES : readers.open(pipe, signal)
    },
    writeLine: (path, line) => {
      const pipe = pipeAt(path)
      if (pipe === undefined) return Promise.resolve({ kind: 'failed', reason: 'not-a-pipe' })
      const reader = readers.first(pipe)
      if (reader === undefined) return Promise.resolve({ kind: 'no-reader' })
      for (const part of line.split('\n')) reader.deliver(part)
      return Promise.resolve({ kind: 'written' })
    },
    snapshot: selection => Promise.resolve(snapshotOf(volume, selection)),
    apply: changes =>
      applyInOrder(changes, change => {
        const step = stepOf(volume, change)
        if (step.failure !== undefined) return Promise.resolve(step.failure)
        volume = step.volume
        return Promise.resolve(undefined)
      }),
    state: () => treeToJson(treeOfVolume(volume)),
  }
}

export const createMemoryFiles = (initial: TreeJson): CreatedMemoryFiles => {
  const checked = treeFromJson(initial)
  return checked.kind === 'tree' ? { kind: 'files', files: memoryFilesOf(checked.tree) } : checked
}
