import { describe, expect, it } from 'vitest'

import { type KnownChangeFailure, treeToJson } from '../src/index'
import { NODE_CASES_READING, nodeCase } from './node-results'
import { A_TS, APPLIED, failedCaseName, file, folderWithLinked, LINK_CASE, LINKED_WRITE_CASE, REAL_FOLDER, SKIPPED } from './real-folder'

const REFUSED_LINKS: ReadonlyMap<string, KnownChangeFailure> = new Map([
  ['a link from a missing path', 'not-found'],
  ['a link from a directory', 'is-a-directory'],
  ['a link onto an existing path', 'exists'],
])

const outcomesAndAfter = (name: string): unknown => {
  const results = nodeCase(name)?.results
  return [results?.outcomes, results?.after]
}

describe('a link change gives a file a second name', () => {
  it('a link change gives an existing file a second name with the same content', () => {
    expect({
      read: NODE_CASES_READING.kind,
      linked: outcomesAndAfter(LINK_CASE),
      rewritten: outcomesAndAfter(LINKED_WRITE_CASE),
    }).toStrictEqual({
      read: 'cases',
      linked: [[APPLIED], treeToJson(folderWithLinked([file('names/a.ts', A_TS, false, 2), file('src/a.ts', A_TS, false, 2)]))],
      rewritten: [[APPLIED, APPLIED], treeToJson(folderWithLinked([file('names/a.ts', A_TS), file('src/a.ts', 'export const a = 4\n')]))],
    })
  })

  it('a link change from a missing path, from a directory, or onto an existing path fails with its reason', () => {
    const answered = Object.fromEntries([...REFUSED_LINKS.keys()].map(name => [name, outcomesAndAfter(failedCaseName(name))]))

    expect({ read: NODE_CASES_READING.kind, answered }).toStrictEqual({
      read: 'cases',
      answered: Object.fromEntries(
        [...REFUSED_LINKS].map(([name, reason]) => [name, [[{ kind: 'failed', reason }, SKIPPED], treeToJson(REAL_FOLDER)]]),
      ),
    })
  })
})
