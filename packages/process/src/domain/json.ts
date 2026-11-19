import { decodeBase64, encodeBase64 } from '@ai-swfactory-oss/bytes'
import {
  changesFromJson,
  changesToJson,
  comparePaths,
  parseChangesJson,
  parseTreeJson,
  treeFromJson,
  treeToJson,
} from '@ai-swfactory-oss/files'

import type {
  CheckedInvocation,
  Execution,
  ExecutionJson,
  Invocation,
  InvocationJson,
  NotStartedReason,
  ProcessEntryJson,
  ProcessState,
  ProgramIdentity,
} from '../types'

export const invocationToJson = (invocation: Invocation): InvocationJson => ({
  program: invocation.program,
  args: invocation.args,
  cwd: invocation.cwd,
  env: invocation.env,
  input: treeToJson(invocation.input),
  ...(invocation.stdin === undefined ? {} : { stdin: encodeBase64(invocation.stdin) }),
  ...(invocation.timeLimitMs === undefined ? {} : { timeLimitMs: invocation.timeLimitMs }),
})

export const invocationFromJson = (json: InvocationJson, location: string): CheckedInvocation => {
  const input = treeFromJson(json.input)
  if (input.kind !== 'tree') return input
  return {
    kind: 'invocation',
    invocation: {
      program: json.program,
      location,
      args: json.args,
      cwd: json.cwd,
      env: json.env,
      input: input.tree,
      ...(json.stdin === undefined ? {} : { stdin: decodeBase64(json.stdin) }),
      ...(json.timeLimitMs === undefined ? {} : { timeLimitMs: json.timeLimitMs }),
    },
  }
}

export const invocationCall = (json: InvocationJson): string => `${json.program.package}@${json.program.version} ${json.args.join(' ')}`

export const executionToJson = (execution: Execution): ExecutionJson =>
  execution.kind === 'not-started'
    ? execution
    : {
        ...execution,
        stdout: encodeBase64(execution.stdout),
        stderr: encodeBase64(execution.stderr),
        changes: changesToJson(execution.changes),
      }

export const executionFromJson = (json: ExecutionJson): Execution => {
  if (json.kind === 'not-started') return json
  const changes = changesFromJson(json.changes)
  return { ...json, stdout: decodeBase64(json.stdout), stderr: decodeBase64(json.stderr), changes }
}

export const repeatedInputPath = (json: InvocationJson): string | undefined => {
  const seen = new Set<string>()
  for (const { path } of json.input.entries) {
    if (seen.has(path)) return path
    seen.add(path)
  }
  return undefined
}

export const invocationKey = (json: InvocationJson): string =>
  JSON.stringify([
    json.program.package,
    json.program.version,
    json.args,
    json.cwd,
    Object.entries(json.env).sort(([a], [b]) => comparePaths(a, b)),
    [...json.input.entries].sort((a, b) => comparePaths(a.path, b.path)),
    json.stdin ?? null,
    json.timeLimitMs ?? null,
  ])

const strings = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') return undefined
    out.push(item)
  }
  return out
}

export const isPathPackage = (name: string): boolean => {
  if (name === '') return false
  if (name.includes('\\')) return true
  const segments = name.split('/')
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..')) return true
  if (segments.length === 1) return false
  const [scope] = segments
  return !(segments.length === 2 && scope !== undefined && scope.length > 1 && scope.startsWith('@'))
}

const programOf = (value: unknown): ProgramIdentity | undefined => {
  if (typeof value !== 'object' || value === null || !('package' in value) || !('version' in value)) return undefined
  const { package: name, version } = value
  if (typeof name !== 'string' || typeof version !== 'string' || isPathPackage(name)) return undefined
  return { package: name, version }
}

const envOf = (value: unknown): Record<string, string> | undefined => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const env: Record<string, string> = {}
  for (const [name, text] of Object.entries(value)) {
    if (typeof text !== 'string') return undefined
    env[name] = text
  }
  return env
}

const invocationJsonOf = (value: unknown): InvocationJson | undefined => {
  if (typeof value !== 'object' || value === null) return undefined
  if (!('program' in value) || !('args' in value) || !('cwd' in value) || !('env' in value) || !('input' in value)) {
    return undefined
  }
  const program = programOf(value.program)
  const args = strings(value.args)
  const env = envOf(value.env)
  const input = parseTreeJson(value.input)
  const { cwd } = value
  const stdin: unknown = 'stdin' in value ? value.stdin : undefined
  const timeLimitMs: unknown = 'timeLimitMs' in value ? value.timeLimitMs : undefined
  if (program === undefined || args === undefined || env === undefined || input === undefined) return undefined
  if (treeFromJson(input).kind === 'non-empty-directory') return undefined
  if (typeof cwd !== 'string') return undefined
  if (stdin !== undefined && typeof stdin !== 'string') return undefined
  if (timeLimitMs !== undefined && typeof timeLimitMs !== 'number') return undefined
  return {
    program,
    args,
    cwd,
    env,
    input,
    ...(stdin === undefined ? {} : { stdin }),
    ...(timeLimitMs === undefined ? {} : { timeLimitMs }),
  }
}

const NOT_STARTED_REASONS: readonly NotStartedReason[] = ['not-found', 'permission-denied', 'other']

const executionJsonOf = (value: unknown): ExecutionJson | undefined => {
  if (typeof value !== 'object' || value === null || !('kind' in value)) return undefined
  if (value.kind === 'not-started') {
    if (!('reason' in value) || !('message' in value) || typeof value.message !== 'string') return undefined
    const { reason: raw } = value
    const reason = NOT_STARTED_REASONS.find(known => known === raw)
    return reason === undefined ? undefined : { kind: 'not-started', reason, message: value.message }
  }
  if (!('stdout' in value) || !('stderr' in value) || !('changes' in value)) return undefined
  const { stdout, stderr } = value
  const changes = parseChangesJson(value.changes)
  if (typeof stdout !== 'string' || typeof stderr !== 'string' || changes === undefined) return undefined
  const output = { stdout, stderr, changes }
  if (value.kind === 'timed-out') return { kind: 'timed-out', ...output }
  if (value.kind === 'exited' && 'exitCode' in value && typeof value.exitCode === 'number') {
    return { kind: 'exited', exitCode: value.exitCode, ...output }
  }
  if (value.kind === 'signalled' && 'signal' in value && typeof value.signal === 'string') {
    return { kind: 'signalled', signal: value.signal, ...output }
  }
  return undefined
}

export const parseProcessState = (value: unknown): ProcessState | undefined => {
  if (typeof value !== 'object' || value === null || !('entries' in value) || !Array.isArray(value.entries)) return undefined
  const raws: readonly unknown[] = value.entries
  const entries: ProcessEntryJson[] = []
  for (const raw of raws) {
    if (typeof raw !== 'object' || raw === null || !('invocation' in raw) || !('execution' in raw)) return undefined
    const invocation = invocationJsonOf(raw.invocation)
    const execution = executionJsonOf(raw.execution)
    if (invocation === undefined || execution === undefined) return undefined
    entries.push({ invocation, execution })
  }
  return { entries }
}
