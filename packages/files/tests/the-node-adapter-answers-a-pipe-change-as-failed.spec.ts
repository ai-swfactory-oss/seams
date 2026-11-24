import { describe, expect, it } from 'vitest'

import { treeToJson } from '../src/index'
import { NODE_CASES_READING, nodeCase } from './node-results'
import { PIPE_CHANGE_CASE, REAL_FOLDER, SKIPPED } from './real-folder'

describe('the node adapter answers a pipe change as failed', () => {
  it('the node adapter answers a pipe change as failed with its stated reason', () => {
    const results = nodeCase(PIPE_CHANGE_CASE)?.results

    expect({ read: NODE_CASES_READING.kind, outcomes: results?.outcomes, after: results?.after }).toStrictEqual({
      read: 'cases',
      outcomes: [{ kind: 'failed', reason: 'unsupported' }, SKIPPED],
      after: treeToJson(REAL_FOLDER),
    })
  })
})
