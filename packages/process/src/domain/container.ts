import { packTar, unpackTar } from '@ai-swfactory-oss/archive'
import { type Change, normalisePath, type Tree, type TreeEntry } from '@ai-swfactory-oss/files'

import type { Ending, Execution, Invocation, Location, NotStarted, NotStartedReason, Process, ProgramIdentity } from '../types'
import { changesFromUpper, type OverlayChange, type UpperEntry } from './overlay'

export interface ContainerEngine {
  readonly program: ProgramIdentity
  readonly location: Location
}

export interface ContainerImage {
  readonly image: string
  readonly location: string
}

export interface ContainerProcessData {
  readonly root: string
  readonly engine: ContainerEngine
  readonly images: Readonly<Record<string, ContainerImage>>
}

export const imageKeyOf = (program: ProgramIdentity): string => `${program.package}@${program.version}`

const NO_INPUT: Tree = { entries: [] }

const decoder = new TextDecoder()

type Ran = { readonly kind: 'ran'; readonly stdout: string; readonly bytes: Uint8Array } | NotStarted

interface ContainerState {
  readonly running: boolean
  readonly status: string
  readonly exitCode: number
}

const notStarted = (reason: NotStartedReason, message: string): NotStarted => ({ kind: 'not-started', reason, message })

const parsedJson = (text: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(text)
    return parsed
  } catch {
    return undefined
  }
}

const clientOsOf = (text: string): string | undefined => {
  const client = parsedJson(text)
  if (typeof client !== 'object' || client === null) return undefined
  const fields: readonly (readonly [string, unknown])[] = Object.entries(client)
  const os = fields.find(([key]) => key.toLowerCase() === 'os')?.[1]
  return typeof os === 'string' ? os.toLowerCase() : undefined
}

const stateOf = (text: string): ContainerState | undefined => {
  const state = parsedJson(text)
  if (typeof state !== 'object' || state === null) return undefined
  if (!('Running' in state) || !('Status' in state) || !('ExitCode' in state)) return undefined
  const { Running: running, Status: status, ExitCode: exitCode } = state
  if (typeof running !== 'boolean' || typeof status !== 'string' || typeof exitCode !== 'number') return undefined
  return { running, status, exitCode }
}

const endingOf = (started: Ending, state: ContainerState | undefined): Ending =>
  started.kind === 'timed-out' && state !== undefined && !state.running && state.status === 'exited'
    ? { kind: 'exited', exitCode: state.exitCode }
    : started

const endingFields = (ending: Ending): Ending => {
  switch (ending.kind) {
    case 'exited':
      return { kind: 'exited', exitCode: ending.exitCode }
    case 'timed-out':
      return { kind: 'timed-out' }
    case 'signalled':
      return { kind: 'signalled', signal: ending.signal }
  }
}

const parentsOf = (path: string): string[] => {
  const segments = path.split('/')
  return segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('/'))
}

const withParents = (paths: Iterable<string>): Set<string> => new Set([...paths].flatMap(path => [path, ...parentsOf(path)]))

const underRoot = (root: string, path: string): string | undefined => {
  const prefix = `${root}/`
  return path.startsWith(prefix) ? normalisePath(path.slice(prefix.length)) : undefined
}

interface DiffLine {
  readonly mark: string
  readonly path: string
}

const diffOf = (root: string, text: string): DiffLine[] =>
  text.split('\n').flatMap(line => {
    const mark = line.slice(0, 1)
    const path = underRoot(root, line.slice(2).trim())
    return line.slice(1, 2) === ' ' && ['A', 'C', 'D'].includes(mark) && path !== undefined && path !== '' ? [{ mark, path }] : []
  })

const finalTreeOf = (bytes: Uint8Array): ReadonlyMap<string, TreeEntry> | undefined => {
  const unpacked = unpackTar(bytes)
  if (unpacked.kind !== 'tree') return undefined
  return new Map(
    unpacked.tree.entries.flatMap(entry => {
      const path = entry.path.split('/').slice(1).join('/')
      return path === '' ? [] : [[path, { ...entry, path }] as const]
    }),
  )
}

const upperEntryOf = (path: string, entry: TreeEntry | undefined, present: ReadonlySet<string>): UpperEntry | undefined => {
  if (entry === undefined) return present.has(path) ? { path, kind: 'directory', opaque: false } : undefined
  switch (entry.kind) {
    case 'file':
      return { path, kind: 'file', content: entry.content, executable: entry.executable }
    case 'symlink':
      return { path, kind: 'symlink', target: entry.target }
    case 'directory':
      return { path, kind: 'directory', opaque: false }
    case 'pipe':
      return undefined
  }
}

const upperOf = (diff: readonly DiffLine[], final: ReadonlyMap<string, TreeEntry>, input: Tree): UpperEntry[] => {
  const present = withParents(final.keys())
  const upper = new Map<string, UpperEntry>()
  for (const path of withParents(input.entries.map(entry => entry.path))) {
    if (!present.has(path)) upper.set(path, { path, kind: 'whiteout' })
  }
  for (const { mark, path } of diff) {
    const entry = mark === 'D' ? { path, kind: 'whiteout' as const } : upperEntryOf(path, final.get(path), present)
    if (entry !== undefined) upper.set(path, entry)
  }
  return [...upper.values()]
}

const changeOf = (change: OverlayChange, upper: readonly UpperEntry[]): Change[] => {
  if (change.kind !== 'stat') return [change]
  const entry = upper.find(candidate => candidate.path === change.path)
  return entry?.kind === 'file' ? [{ kind: 'write', path: entry.path, content: entry.content, executable: change.executable }] : []
}

const inputTarOf = (root: string, input: Tree): Uint8Array =>
  packTar({
    entries: [{ path: root, kind: 'directory' }, ...input.entries.map(entry => ({ ...entry, path: `${root}/${entry.path}` }))],
  })

const failureOf = (execution: Execution, step: string): NotStarted => {
  if (execution.kind === 'not-started') return execution
  const detail = decoder.decode(execution.stderr).trim()
  return notStarted('other', `the container engine's ${step} did not succeed${detail === '' ? '' : `: ${detail}`}`)
}

export const createContainerProcess = (data: ContainerProcessData, ports: { readonly process: Process }): Process => {
  const relativeRoot = (data.root.startsWith('/') ? normalisePath(data.root.slice(1)) : undefined) ?? ''
  const root = `/${relativeRoot}`

  const engine = (args: readonly string[], extra: Partial<Pick<Invocation, 'env' | 'stdin' | 'timeLimitMs'>> = {}): Promise<Execution> =>
    ports.process.execute({
      program: data.engine.program,
      location: data.engine.location,
      args,
      cwd: '',
      env: {},
      input: NO_INPUT,
      ...extra,
    })

  const ran = async (
    step: string,
    args: readonly string[],
    extra: Partial<Pick<Invocation, 'env' | 'stdin' | 'timeLimitMs'>> = {},
  ): Promise<Ran> => {
    const execution = await engine(args, extra)
    if (execution.kind !== 'exited' || execution.exitCode !== 0) return failureOf(execution, step)
    return { kind: 'ran', stdout: decoder.decode(execution.stdout), bytes: execution.stdout }
  }

  let clientOs: Promise<Ran> | undefined
  const hostRefusal = async (): Promise<NotStarted | undefined> => {
    clientOs ??= ran('version', ['version', '--format', '{{json .Client}}'])
    const version = await clientOs
    if (version.kind !== 'ran') return version
    const os = clientOsOf(version.stdout)
    if (os === undefined) return notStarted('other', 'the container engine did not report its client OS')
    return os === 'linux'
      ? undefined
      : notStarted('unsupported-host', `the container adapter runs on linux only, and the engine client runs on ${os}`)
  }

  const runIn = async (id: string, invocation: Invocation): Promise<Execution> => {
    const copied = await ran('copy in', ['cp', '-', `${id}:/`], { stdin: inputTarOf(relativeRoot, invocation.input) })
    if (copied.kind !== 'ran') return copied
    const started = await engine(['start', '-a', ...(invocation.stdin === undefined ? [] : ['-i']), id], {
      ...(invocation.stdin === undefined ? {} : { stdin: invocation.stdin }),
      ...(invocation.timeLimitMs === undefined ? {} : { timeLimitMs: invocation.timeLimitMs }),
    })
    if (started.kind === 'not-started') return started
    const inspected = await ran('inspect', ['inspect', '--format', '{{json .State}}', id])
    const ending = endingOf(endingFields(started), inspected.kind === 'ran' ? stateOf(inspected.stdout) : undefined)
    const diffed = await ran('diff', ['diff', id])
    if (diffed.kind !== 'ran') return diffed
    const copiedOut = await ran('copy out', ['cp', `${id}:${root}`, '-'])
    if (copiedOut.kind !== 'ran') return copiedOut
    const final = finalTreeOf(copiedOut.bytes)
    if (final === undefined) return notStarted('other', `the container engine's copy out of ${root} is not a tar`)
    const upper = upperOf(diffOf(root, diffed.stdout), final, invocation.input)
    const changes = changesFromUpper(upper, invocation.input).flatMap(change => changeOf(change, upper))
    return { ...ending, stdout: started.stdout, stderr: started.stderr, changes }
  }

  return {
    execute: async invocation => {
      if (relativeRoot === '') return notStarted('other', `the container root is not an absolute directory below /: ${data.root}`)
      const refusal = await hostRefusal()
      if (refusal !== undefined) return refusal
      const mapped = data.images[imageKeyOf(invocation.program)]
      if (mapped === undefined) return notStarted('not-found', `no image is mapped for ${imageKeyOf(invocation.program)}`)
      const names = Object.keys(invocation.env).sort()
      const workdir = invocation.cwd === '' ? root : `${root}/${invocation.cwd}`
      const created = await ran(
        'create',
        [
          'create',
          ...(invocation.stdin === undefined ? [] : ['-i']),
          '-w',
          workdir,
          ...names.flatMap(name => ['-e', name]),
          mapped.image,
          mapped.location,
          ...invocation.args,
        ],
        { env: invocation.env },
      )
      if (created.kind !== 'ran') return created
      const id = created.stdout.trim()
      try {
        return await runIn(id, invocation)
      } finally {
        await engine(['rm', '-f', id])
      }
    },
  }
}
