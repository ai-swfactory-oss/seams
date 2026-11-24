import { describe, expect, it } from 'vitest'

import { type GeneratedFilesResults, generateFilesResults } from '../src/generate/index'
import { treeToJson } from '../src/index'
import { memoryFilesOver } from './memory-files'
import { NODE_CASES, NODE_CASES_READING, type NodeCase } from './node-results'
import { APPLIED, file, PIPE_CHANGE_CASE, REAL_FOLDER } from './real-folder'

interface Divergence {
  readonly because: string
  readonly memory: (real: NodeCase) => GeneratedFilesResults
}

const DIVERGENCES: ReadonlyMap<string, Divergence> = new Map([
  [
    PIPE_CHANGE_CASE,
    {
      because: 'the node adapter answers a pipe change as failed until ai-swfactory-oss/seams#131 moves it to the process port',
      memory: ({ results }: NodeCase): GeneratedFilesResults => ({
        kind: 'results',
        results: {
          ...results,
          outcomes: [APPLIED, APPLIED],
          after: treeToJson({
            entries: [
              file('after.txt', 'after\n'),
              ...REAL_FOLDER.entries.filter(entry => entry.path < 'events'),
              { path: 'events', kind: 'pipe' },
              ...REAL_FOLDER.entries.filter(entry => entry.path > 'events'),
            ],
          }),
        },
      }),
    },
  ],
])

describe('memory files match the generated real results', () => {
  it('for every generated real snapshot and apply result the memory adapter gives the same result', async () => {
    const replayed = await Promise.all(
      NODE_CASES.map(async ({ name, generation }) => ({
        name,
        result: await generateFilesResults(generation, { files: memoryFilesOver({ entries: [] }) }),
      })),
    )

    expect({ read: NODE_CASES_READING.kind, cases: NODE_CASES.length, diverging: [...DIVERGENCES.keys()], replayed }).toStrictEqual({
      read: 'cases',
      cases: 18,
      diverging: [PIPE_CHANGE_CASE],
      replayed: NODE_CASES.map(real => ({
        name: real.name,
        result: DIVERGENCES.get(real.name)?.memory(real) ?? { kind: 'results', results: real.results },
      })),
    })
  })
})
