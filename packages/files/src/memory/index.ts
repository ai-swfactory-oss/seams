import { applyInOrder } from '../domain/apply'
import { treeFromJson, treeToJson } from '../domain/json'
import { snapshotOf, stepOf, treeOfVolume, type Volume, volumeOf } from '../domain/volume'
import type { Files, TreeJson } from '../types'

export interface MemoryFiles extends Files {
  readonly state: () => TreeJson
}

export const createMemoryFiles = (initial: TreeJson): MemoryFiles => {
  let volume: Volume = volumeOf(treeFromJson(initial))
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
