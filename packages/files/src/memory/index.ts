import { applyInOrder } from '../domain/apply'
import { treeFromJson, treeToJson } from '../domain/json'
import { snapshotOf, stepOf, treeOfVolume, type Volume, volumeOf } from '../domain/volume'
import type { DuplicatePath, Files, NonEmptyDirectory, Tree, TreeJson } from '../types'

export interface MemoryFiles extends Files {
  readonly state: () => TreeJson
}

export type CreatedMemoryFiles = { readonly kind: 'files'; readonly files: MemoryFiles } | NonEmptyDirectory | DuplicatePath

const memoryFilesOf = (initial: Tree): MemoryFiles => {
  let volume: Volume = volumeOf(initial)
  return {
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
