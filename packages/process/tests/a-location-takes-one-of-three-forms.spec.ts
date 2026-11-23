import { describe, expect, it } from 'vitest'

import { generateProcessEntries } from '../src/generate/index'
import type { Location } from '../src/index'
import { checkLocation } from '../src/index'
import { createMemoryProcess } from '../src/memory/index'
import { LINT_ENTRY } from './fixtures'

const ANCHOR = 'file:///app/node_modules/@ai-swfactory-oss/git/dist/index.js'

const NATIVE = {
  anchor: ANCHOR,
  targets: {
    'linux-x64': '@ai-swfactory-oss/git-linux-x64/git/bin/git',
    'linux-arm64-musl': '@ai-swfactory-oss/git-linux-arm64-musl/git/bin/git',
    'darwin-arm64': '@ai-swfactory-oss/git-darwin-arm64/git/bin/git',
  },
  env: { GIT_EXEC_PATH: 'git/libexec/git-core', GIT_TEMPLATE_DIR: 'git/share/git-core/templates' },
}

const ACCEPTED: readonly (readonly [string, Location])[] = [
  ['a native target table', NATIVE],
  ['a native target table with an unscoped package', { anchor: ANCHOR, targets: { 'win32-x64': 'git-win32-x64/git.exe' }, env: {} }],
  ['a module entry', { anchor: ANCHOR, module: '@ai-swfactory-oss/yamllint/dist/cli.js' }],
  ['an unscoped module entry', { anchor: ANCHOR, module: 'typescript/bin/tsc' }],
  ['a path inside the adapter root', 'bin/git'],
  ['a file at the adapter root', 'run.sh'],
]

const WITHOUT_ENV = { anchor: NATIVE.anchor, targets: NATIVE.targets }

const REFUSED: readonly (readonly [string, unknown])[] = [
  ['an absolute path', '/usr/bin/git'],
  ['a path that leaves the root', '../bin/git'],
  ['a path through a parent folder', 'bin/../../git'],
  ['a path with an empty segment', 'bin//git'],
  ['a path with a backslash', 'bin\\git'],
  ['the empty path', ''],
  ['the root itself', '.'],
  ['a number', 7],
  ['null', null],
  ['an array', ['bin/git']],
  ['an object of no form', { path: 'bin/git' }],
  ['a native target table without its env map', WITHOUT_ENV],
  ['a native target table whose env map is not a map', { ...NATIVE, env: ['GIT_EXEC_PATH'] }],
  ['a native target table whose env path leaves the tree', { ...NATIVE, env: { GIT_EXEC_PATH: '../libexec' } }],
  ['a native target table whose env names no variable', { ...NATIVE, env: { 'GIT EXEC': 'libexec' } }],
  ['a native target table whose target names no subpath', { ...NATIVE, targets: { 'linux-x64': '@ai-swfactory-oss/git-linux-x64' } }],
  ['a native target table whose target is absolute', { ...NATIVE, targets: { 'linux-x64': '/usr/bin/git' } }],
  ['a native target table that also names a module', { ...NATIVE, module: 'git/bin/git' }],
  ['a native target table without an anchor', { targets: NATIVE.targets, env: NATIVE.env }],
  ['a native target table whose anchor is not a URL', { ...NATIVE, anchor: '/app/index.js' }],
  ['a module entry without an anchor', { module: 'typescript/bin/tsc' }],
  ['a module entry that names only a package', { anchor: ANCHOR, module: 'typescript' }],
  ['a module entry that names only a scoped package', { anchor: ANCHOR, module: '@ai-swfactory-oss/yamllint' }],
  ['a module entry that is a relative path', { anchor: ANCHOR, module: './bin/tsc' }],
  ['a module entry that is not a string', { anchor: ANCHOR, module: 3 }],
]

const TARGET_KEYS = ['linux', 'linux-amd64', 'Linux-x64', 'linux-x64-gnu', 'linux-x64-glibc-2', 'macos-arm64', 'linux_x64', '']

const TARGETS_ACCEPTED = ['linux-x64', 'linux-arm64', 'darwin-arm64', 'darwin-x64', 'win32-x64', 'linux-x64-glibc', 'linux-arm64-musl']

describe('a location takes one of three forms', () => {
  it.each(ACCEPTED)(
    "a location that is a native target table, a module entry, or a path inside the adapter's root is accepted: %s",
    (_, location) => {
      expect(checkLocation(location)).toStrictEqual({ kind: 'location', location })
    },
  )

  it.each(REFUSED)(
    'a location that matches none of the three forms is refused as data, and the refusal names the location: %s',
    (_, location) => {
      expect(checkLocation(location)).toStrictEqual({
        kind: 'unknown-location',
        location: typeof location === 'object' && location !== null ? JSON.stringify(location) : String(location),
      })
    },
  )

  it.each(TARGET_KEYS)(
    'a target key other than <platform>-<arch> or <platform>-<arch>-<libc> is refused as data, naming the key: %j',
    key => {
      expect(checkLocation({ ...NATIVE, targets: { 'darwin-arm64': 'git-darwin-arm64/bin/git', [key]: 'git-x/bin/git' } })).toStrictEqual({
        kind: 'unknown-target',
        target: key,
      })
    },
  )

  it.each(TARGETS_ACCEPTED)('a target key %s is accepted', key => {
    const location = { ...NATIVE, targets: { [key]: 'git-x/bin/git' } }

    expect(checkLocation(location)).toStrictEqual({ kind: 'location', location })
  })

  it('a native target table without its env map is refused, and one with an empty env map is accepted', () => {
    const empty = { ...NATIVE, env: {} }

    expect([checkLocation(WITHOUT_ENV).kind, checkLocation(empty)]).toStrictEqual([
      'unknown-location',
      { kind: 'location', location: empty },
    ])
  })

  it('the process generator refuses a run whose location takes no form, naming the run and the location, and runs nothing', async () => {
    const process = createMemoryProcess({ entries: [] })

    await expect(
      generateProcessEntries(
        {
          runs: [
            { invocation: LINT_ENTRY.invocation, location: 'bin/yamllint' },
            { invocation: LINT_ENTRY.invocation, location: '/usr/bin/yamllint' },
          ],
        },
        { process },
      ),
    ).resolves.toStrictEqual({ kind: 'unknown-location', location: '/usr/bin/yamllint', run: 2 })
  })

  it('the process generator refuses a run whose target key is not a target, naming the key', async () => {
    const process = createMemoryProcess({ entries: [] })

    await expect(
      generateProcessEntries(
        { runs: [{ invocation: LINT_ENTRY.invocation, location: { ...NATIVE, targets: { 'linux-amd64': 'git-x/bin/git' } } }] },
        { process },
      ),
    ).resolves.toStrictEqual({ kind: 'unknown-target', target: 'linux-amd64', run: 1 })
  })
})
