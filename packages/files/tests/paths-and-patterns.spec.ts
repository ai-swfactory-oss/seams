import { describe, expect, it } from 'vitest'

import { globMatcher } from '../src/domain/glob'
import { joinPath, normalisePath } from '../src/index'

describe('joinPath', () => {
  it('puts a name inside a directory, and a name at the root needs no separator', () => {
    expect([joinPath('a/b', 'c'), joinPath('', 'c')]).toEqual(['a/b/c', 'c'])
  })
})

describe('normalisePath', () => {
  it('drops empty and dot segments', () => {
    expect(['a//b/./c/', './a', '', '.'].map(normalisePath)).toEqual(['a/b/c', 'a', '', ''])
  })

  it('refuses absolute paths, climbing segments and NUL', () => {
    expect(['/a', 'a/../b', '..', 'a\0b'].map(normalisePath)).toEqual([undefined, undefined, undefined, undefined])
  })
})

describe('globMatcher', () => {
  const matches = (pattern: string, paths: readonly string[]): boolean[] => paths.map(globMatcher(pattern))

  it('matches * and ? within one segment, dotfiles included', () => {
    expect(matches('*.ts', ['a.ts', '.hidden.ts', 'dir/a.ts', 'a.tsx'])).toEqual([true, true, false, false])
    expect(matches('a?c', ['abc', 'a/c', 'ac'])).toEqual([true, false, false])
  })

  it('matches ** as zero or more whole segments', () => {
    expect(matches('**/*.ts', ['a.ts', 'x/a.ts', 'x/y/a.ts'])).toEqual([true, true, true])
    expect(matches('src/**', ['src', 'src/a', 'src/a/b', 'srcx'])).toEqual([true, true, true, false])
    expect(matches('a/**/b', ['a/b', 'a/x/b', 'a/x/y/b', 'ab'])).toEqual([true, true, true, false])
  })

  it('matches either alternative of a brace group, nested ones too', () => {
    expect(matches('*.{ts,{m,c}js}', ['a.ts', 'a.mjs', 'a.cjs', 'a.js'])).toEqual([true, true, true, false])
  })

  it('treats every other character literally', () => {
    expect(matches('a+(b).[c]', ['a+(b).[c]', 'aab.c'])).toEqual([true, false])
  })
})
