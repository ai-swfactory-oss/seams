import { describe, expect, it } from 'vitest'

import { treeToJson } from '../src/index'
import { NODE_CASES_READING, nodeCase } from './node-results'
import { A_TS, APPLIED, file, folderWithLinked, LINK_CASE, LINKED_DELETE_CASE } from './real-folder'

const secondNameIn = (name: string): unknown => nodeCase(name)?.results.after.entries.find(entry => entry.path === 'names/a.ts')

describe('a snapshot gives each file its link count', () => {
  it('deleting one name of a linked file leaves the other name readable and its link count drops by one', () => {
    const deleted = nodeCase(LINKED_DELETE_CASE)?.results

    expect({
      read: NODE_CASES_READING.kind,
      before: secondNameIn(LINK_CASE),
      after: secondNameIn(LINKED_DELETE_CASE),
      outcomes: deleted?.outcomes,
      tree: deleted?.after,
    }).toStrictEqual({
      read: 'cases',
      before: treeToJson({ entries: [file('names/a.ts', A_TS, false, 2)] }).entries[0],
      after: treeToJson({ entries: [file('names/a.ts', A_TS, false, 1)] }).entries[0],
      outcomes: [APPLIED, APPLIED],
      tree: treeToJson(folderWithLinked([file('names/a.ts', A_TS)])),
    })
  })
})
