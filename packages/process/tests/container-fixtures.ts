import { packTar } from '@ai-swfactory-oss/archive'
import { encodeBase64 } from '@ai-swfactory-oss/bytes'
import type { Tree } from '@ai-swfactory-oss/files'

import type { ContainerEngine, ContainerProcessData } from '../src/container/index'
import { type ExecutionJson, type Invocation, invocationToJson, type ProcessEntryJson } from '../src/index'
import { LINT, text } from './fixtures'

export const DOCKER: ContainerEngine = {
  program: { package: '@ai-swfactory-oss/docker', version: '28.0.4' },
  location: 'bundles/docker/bin/docker',
}

export const PODMAN: ContainerEngine = {
  program: { package: '@ai-swfactory-oss/podman', version: '5.4.2' },
  location: 'bundles/podman/bin/podman',
}

const IMAGE = 'ghcr.io/ai-swfactory-oss/yamllint:1.37.1'
const IN_IMAGE = '/usr/local/bin/yamllint'
export const ID = 'c0ffee'

export const dataFor = (engine: ContainerEngine): ContainerProcessData => ({
  root: '/work',
  engine,
  images: { '@ai-swfactory-oss/yamllint@1.37.1': { image: IMAGE, location: IN_IMAGE } },
})

export const RUN: Invocation = {
  ...LINT,
  args: ['-f', 'parsable', 'a.yaml'],
  input: {
    entries: [
      { path: 'a.yaml', kind: 'file', content: text('a: 1\n'), executable: false },
      { path: 'old.txt', kind: 'file', content: text('old\n'), executable: false },
    ],
  },
}

export const REPORT = 'a.yaml:1:1: [warning] missing document start "---"\n'

const OUTPUT: Tree = {
  entries: [
    { path: 'work/a.yaml', kind: 'file', content: text('a: 1\n'), executable: false },
    { path: 'work/report.txt', kind: 'file', content: text(REPORT), executable: false },
  ],
}

const DIFF = 'C /tmp\nC /work\nA /work/a.yaml\nA /work/report.txt\n'

export const exited = (stdout: string | Uint8Array, exitCode = 0, stderr = ''): ExecutionJson => ({
  kind: 'exited',
  exitCode,
  stdout: encodeBase64(typeof stdout === 'string' ? text(stdout) : stdout),
  stderr: encodeBase64(text(stderr)),
  changes: [],
})

export const engineEntry = (
  engine: ContainerEngine,
  args: readonly string[],
  execution: ExecutionJson,
  extra: Partial<Pick<Invocation, 'env' | 'stdin' | 'timeLimitMs'>> = {},
): ProcessEntryJson => ({
  invocation: invocationToJson({
    program: engine.program,
    location: engine.location,
    args,
    cwd: '',
    env: {},
    input: { entries: [] },
    ...extra,
  }),
  execution,
})

export const clientEntry = (engine: ContainerEngine, os: string): ProcessEntryJson =>
  engineEntry(engine, ['version', '--format', '{{json .Client}}'], exited(JSON.stringify(engine === PODMAN ? { OS: os } : { Os: os })))

export const createEntry = (engine: ContainerEngine, run: Invocation = RUN): ProcessEntryJson =>
  engineEntry(
    engine,
    [
      'create',
      '-w',
      '/work',
      ...Object.keys(run.env)
        .sort()
        .flatMap(name => ['-e', name]),
      IMAGE,
      IN_IMAGE,
      ...run.args,
    ],
    exited(`${ID}\n`),
    { env: run.env },
  )

export const copyInEntry = (engine: ContainerEngine, run: Invocation = RUN): ProcessEntryJson =>
  engineEntry(engine, ['cp', '-', `${ID}:/`], exited(''), {
    stdin: packTar({
      entries: [{ path: 'work', kind: 'directory' }, ...run.input.entries.map(entry => ({ ...entry, path: `work/${entry.path}` }))],
    }),
  })

export const startEntry = (engine: ContainerEngine, execution: ExecutionJson, timeLimitMs?: number): ProcessEntryJson =>
  engineEntry(engine, ['start', '-a', ID], execution, timeLimitMs === undefined ? {} : { timeLimitMs })

export const inspectEntry = (
  engine: ContainerEngine,
  state: { readonly Status: string; readonly Running: boolean; readonly ExitCode: number },
): ProcessEntryJson => engineEntry(engine, ['inspect', '--format', '{{json .State}}', ID], exited(JSON.stringify(state)))

export const diffEntry = (engine: ContainerEngine, diff: string = DIFF): ProcessEntryJson => engineEntry(engine, ['diff', ID], exited(diff))

export const copyOutEntry = (engine: ContainerEngine, output: Tree = OUTPUT): ProcessEntryJson =>
  engineEntry(engine, ['cp', `${ID}:/work`, '-'], exited(packTar({ entries: [{ path: 'work', kind: 'directory' }, ...output.entries] })))

export const removeEntry = (engine: ContainerEngine): ProcessEntryJson => engineEntry(engine, ['rm', '-f', ID], exited(''))

export const lintRun = (engine: ContainerEngine): ProcessEntryJson[] => [
  clientEntry(engine, 'linux'),
  createEntry(engine),
  copyInEntry(engine),
  startEntry(engine, exited(REPORT, 1)),
  inspectEntry(engine, { Status: 'exited', Running: false, ExitCode: 1 }),
  diffEntry(engine),
  copyOutEntry(engine),
  removeEntry(engine),
]

export const LINT_EXECUTION = {
  kind: 'exited',
  exitCode: 1,
  stdout: text(REPORT),
  stderr: new Uint8Array(),
  changes: [
    { kind: 'delete', path: 'old.txt' },
    { kind: 'write', path: 'report.txt', content: text(REPORT), executable: false },
  ],
}
