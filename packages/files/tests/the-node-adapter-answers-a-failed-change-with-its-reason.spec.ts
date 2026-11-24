import { describe, expect, it } from 'vitest'

import { treeToJson } from '../src/index'
import { NODE_CASES_READING, nodeCase } from './node-results'
import { failedCaseName, REAL_FOLDER, SKIPPED, UNPERFORMABLE_CHANGES } from './real-folder'

describe('the node adapter answers a failed change with its reason', () => {
  it('a change the node adapter cannot perform is answered as failed with its reason', () => {
    const answered = Object.fromEntries(
      UNPERFORMABLE_CHANGES.map(({ name }) => {
        const results = nodeCase(failedCaseName(name))?.results
        return [name, [results?.outcomes, results?.after]]
      }),
    )

    expect({ read: NODE_CASES_READING.kind, answered }).toStrictEqual({
      read: 'cases',
      answered: Object.fromEntries(
        UNPERFORMABLE_CHANGES.map(({ name, reason }) => [name, [[{ kind: 'failed', reason }, SKIPPED], treeToJson(REAL_FOLDER)]]),
      ),
    })
  })
})
