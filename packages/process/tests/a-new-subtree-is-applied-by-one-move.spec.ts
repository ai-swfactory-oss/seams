import type { Tree } from '@ai-swfactory-oss/files'
import { describe, expect, it } from 'vitest'

import { applyBackPlan, type UpperEntry } from '../src/index'
import { text } from './fixtures'

const LOWER: Tree = {
  entries: [
    { path: 'package.json', kind: 'file', content: text('{}\n'), executable: false },
    { path: 'node_modules/.modules.yaml', kind: 'file', content: text('a: 1\n'), executable: false },
  ],
}

const file = (path: string, content: string): UpperEntry => ({ path, kind: 'file', content: text(content), executable: false })

describe('the apply-back plan', () => {
  it('moves a directory absent from the lower tree as one step, not one write per file', () => {
    const upper: readonly UpperEntry[] = [
      { path: 'node_modules', kind: 'directory', opaque: false },
      { path: 'node_modules/.pnpm', kind: 'directory', opaque: false },
      { path: 'node_modules/.pnpm/a@1.0.0', kind: 'directory', opaque: false },
      file('node_modules/.pnpm/a@1.0.0/index.js', 'a'),
      file('node_modules/.pnpm/a@1.0.0/package.json', '{"name":"a"}'),
      { path: 'node_modules/a', kind: 'symlink', target: '.pnpm/a@1.0.0' },
      file('package.json', '{"dependencies":{"a":"1.0.0"}}\n'),
    ]

    expect(applyBackPlan(upper, LOWER)).toEqual([
      { kind: 'move-from-upper', path: 'node_modules/.pnpm' },
      { kind: 'symlink', path: 'node_modules/a', target: '.pnpm/a@1.0.0' },
      { kind: 'write', path: 'package.json', content: text('{"dependencies":{"a":"1.0.0"}}\n'), executable: false },
    ])
  })

  it('moves an opaque directory after deleting what it hides', () => {
    const upper: readonly UpperEntry[] = [{ path: 'node_modules', kind: 'directory', opaque: true }, file('node_modules/b.js', 'b')]

    expect(applyBackPlan(upper, LOWER)).toEqual([
      { kind: 'delete', path: 'node_modules' },
      { kind: 'move-from-upper', path: 'node_modules' },
    ])
  })
})
