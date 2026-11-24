import { describe, expect, it } from 'vitest'

import { globMatcher } from '../src/domain/glob'
import { escapeGlob, type TreeEntryJson } from '../src/index'
import { entriesOf, memoryFilesOver } from './memory-files'

const NAMES = ['star*.txt', 'what?.txt', '{a,b}.txt', 'a.txt', 'b.txt', '[x].txt', 'back\\slash.txt', 'back\\', 'dir*/**', '**']

describe('escapeGlob', () => {
  it.each(NAMES)('gives a pattern that matches %s and no other name', name => {
    const matches = globMatcher(escapeGlob(name))

    expect(NAMES.filter(other => matches(other))).toEqual([name])
  })

  it('keeps a path of several segments as one exact match', () => {
    const matches = globMatcher(escapeGlob('dir*/sub{1,2}/x?.txt'))

    expect(['dir*/sub{1,2}/x?.txt', 'dirA/sub1/xA.txt', 'dir*/sub1/x?.txt'].map(matches)).toEqual([true, false, false])
  })

  it('leaves the unescaped glob characters working beside an escaped one', () => {
    const matches = globMatcher(`${escapeGlob('{a,b}')}*.txt`)

    expect(['{a,b}.txt', '{a,b}-1.txt', 'a.txt'].map(matches)).toEqual([true, true, false])
  })

  it('narrows a snapshot to exactly the named entries', async () => {
    const content = 'eA=='
    const files = memoryFilesOver({
      entries: NAMES.filter(name => !name.includes('/')).map((path): TreeEntryJson => ({ path, kind: 'file', content, executable: false })),
    })

    const entries = entriesOf(await files.snapshot({ root: '', include: ['{a,b}.txt', 'back\\slash.txt'].map(escapeGlob), exclude: [] }))

    expect(entries.map(entry => entry.path)).toEqual(['back\\slash.txt', '{a,b}.txt'])
  })
})
