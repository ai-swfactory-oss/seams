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

const ACCEPTED: readonly { readonly name: string; readonly location: Location }[] = [
  { name: 'a native target table', location: NATIVE },
  {
    name: 'a native target table with an unscoped package',
    location: { anchor: ANCHOR, targets: { 'win32-x64': 'git-win32-x64/git.exe' }, env: {} },
  },
  { name: 'a module entry', location: { anchor: ANCHOR, module: '@ai-swfactory-oss/yamllint/dist/cli.js' } },
  { name: 'an unscoped module entry', location: { anchor: ANCHOR, module: 'typescript/bin/tsc' } },
  { name: 'a path inside the adapter root', location: 'bin/git' },
  { name: 'a file at the adapter root', location: 'run.sh' },
]

const WITHOUT_ENV = { anchor: NATIVE.anchor, targets: NATIVE.targets }

const REFUSED: readonly { readonly name: string; readonly location: unknown }[] = [
  { name: 'an absolute path', location: '/usr/bin/git' },
  { name: 'a path that leaves the root', location: '../bin/git' },
  { name: 'a path through a parent folder', location: 'bin/../../git' },
  { name: 'a path with an empty segment', location: 'bin//git' },
  { name: 'a path with a backslash', location: 'bin\\git' },
  { name: 'the empty path', location: '' },
  { name: 'the root itself', location: '.' },
  { name: 'a number', location: 7 },
  { name: 'null', location: null },
  { name: 'an array', location: ['bin/git'] },
  { name: 'an object of no form', location: { path: 'bin/git' } },
  { name: 'a native target table without its env map', location: WITHOUT_ENV },
  { name: 'a native target table whose env map is not a map', location: { ...NATIVE, env: ['GIT_EXEC_PATH'] } },
  { name: 'a native target table whose env path leaves the tree', location: { ...NATIVE, env: { GIT_EXEC_PATH: '../libexec' } } },
  { name: 'a native target table whose env names no variable', location: { ...NATIVE, env: { 'GIT EXEC': 'libexec' } } },
  {
    name: 'a native target table whose target names no subpath',
    location: { ...NATIVE, targets: { 'linux-x64': '@ai-swfactory-oss/git-linux-x64' } },
  },
  { name: 'a native target table whose target is absolute', location: { ...NATIVE, targets: { 'linux-x64': '/usr/bin/git' } } },
  { name: 'a native target table that also names a module', location: { ...NATIVE, module: 'git/bin/git' } },
  { name: 'a native target table without an anchor', location: { targets: NATIVE.targets, env: NATIVE.env } },
  { name: 'a native target table whose anchor is not a URL', location: { ...NATIVE, anchor: '/app/index.js' } },
  { name: 'a module entry without an anchor', location: { module: 'typescript/bin/tsc' } },
  { name: 'a module entry that names only a package', location: { anchor: ANCHOR, module: 'typescript' } },
  { name: 'a module entry that names only a scoped package', location: { anchor: ANCHOR, module: '@ai-swfactory-oss/yamllint' } },
  { name: 'a module entry that is a relative path', location: { anchor: ANCHOR, module: './bin/tsc' } },
  { name: 'a module entry that is not a string', location: { anchor: ANCHOR, module: 3 } },
]

const TARGET_KEYS = ['linux', 'linux-amd64', 'Linux-x64', 'linux-x64-gnu', 'linux-x64-glibc-2', 'macos-arm64', 'linux_x64', '']

const TARGETS_ACCEPTED = ['linux-x64', 'linux-arm64', 'darwin-arm64', 'darwin-x64', 'win32-x64', 'linux-x64-glibc', 'linux-arm64-musl']

describe('a location takes one of three forms', () => {
  it.each(ACCEPTED)(
    "a location that is a native target table, a module entry, or a path inside the adapter's root is accepted: $name",
    ({ location }) => {
      expect(checkLocation(location)).toStrictEqual({ kind: 'location', location })
    },
  )

  it.each(REFUSED)(
    'a location that matches none of the three forms is refused as data, and the refusal names the location: $name',
    ({ location }) => {
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
