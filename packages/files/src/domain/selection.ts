import type { Selection } from '../types'
import { globMatcher } from './glob'
import { isWithin, normalisePath, relativeTo } from './path'

export const selectionMatcher = (selection: Selection): ((path: string) => boolean) | undefined => {
  const root = normalisePath(selection.root)
  if (root === undefined) return undefined
  const included = selection.include.map(globMatcher)
  const excluded = selection.exclude.map(globMatcher)
  return path => {
    if (path === root || !isWithin(path, root)) return false
    const relative = relativeTo(path, root)
    return (included.length === 0 || included.some(test => test(relative))) && !excluded.some(test => test(relative))
  }
}
