import { describe, expect, it } from 'vitest'

import { treeToJson } from '../src/index'
import { NODE_CASES_READING, nodeCase } from './node-results'
import { file, REAL_FOLDER } from './real-folder'

describe('the node adapter snapshot returns the selected entries', () => {
  it("the node adapter's snapshot of a real folder returns the selected files, symlinks and directories with their content and executable bit", () => {
    const everything = nodeCase('snapshot of every entry')?.results.snapshot
    const selected = nodeCase('snapshot under a root by include and exclude patterns')?.results.snapshot
    const underASymlink = nodeCase('snapshot of a root that is a symlink to a directory')?.results.snapshot

    expect({ read: NODE_CASES_READING.kind, snapshots: [everything, selected, underASymlink] }).toStrictEqual({
      read: 'cases',
      snapshots: [
        treeToJson(REAL_FOLDER),
        treeToJson({ entries: [file('src/a.ts', 'export const a = 1\n'), file('src/deep/b.ts', 'export const b = 2\n')] }),
        { entries: [] },
      ],
    })
  })
})
