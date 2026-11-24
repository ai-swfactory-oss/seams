import { describe, expect, it } from 'vitest'

import { treeToJson } from '../src/index'
import { NODE_CASES_READING, nodeCase } from './node-results'
import { APPLIED, file } from './real-folder'

describe('the node adapter apply performs each kind of change', () => {
  it("the node adapter's apply performs each kind of change on the disk and answers each change's outcome", () => {
    const results = nodeCase('every kind of change applied')?.results

    expect({ read: NODE_CASES_READING.kind, outcomes: results?.outcomes, after: results?.after }).toStrictEqual({
      read: 'cases',
      outcomes: Array.from({ length: 13 }, () => APPLIED),
      after: treeToJson({
        entries: [
          file('bin/run', 'no longer executable\n'),
          file('bin/tool', '#!/bin/sh\n', true),
          file('c.ts', 'c\n'),
          file('lib/moved/b.ts', 'export const b = 2\n'),
          file('link', 'a file where the symlink was\n'),
          { path: 'links/to-b', kind: 'symlink', target: '../src/deep/b.ts' },
          { path: 'made/here', kind: 'directory' },
          { path: 'new/nested', kind: 'directory' },
          file('src/a.ts', 'export const a = 3\n'),
        ],
      }),
    })
  })
})
