import {
  executionFromJson,
  invocationCall,
  invocationKey,
  invocationToJson,
  isPathPackage,
  parseProcessState,
  repeatedInputPath,
} from '../domain/json'
import type { ExecutionJson, InvocationJson, Process, ProcessState } from '../types'

export class UnknownInvocationError extends Error {
  constructor(readonly invocation: InvocationJson) {
    super(`no entry for ${invocationCall(invocation)}`)
    this.name = 'UnknownInvocationError'
  }
}

export class DuplicateInvocationError extends Error {
  constructor(readonly invocation: InvocationJson) {
    super(`two entries for ${invocationCall(invocation)}`)
    this.name = 'DuplicateInvocationError'
  }
}

export class PathProgramIdentityError extends Error {
  constructor(readonly invocation: InvocationJson) {
    super(`program identity names a path, not a package: ${invocation.program.package}@${invocation.program.version}`)
    this.name = 'PathProgramIdentityError'
  }
}

export class RepeatedInputPathError extends Error {
  constructor(
    readonly invocation: InvocationJson,
    readonly path: string,
  ) {
    super(`the input tree holds two entries at ${path}`)
    this.name = 'RepeatedInputPathError'
  }
}

export class InvalidProcessStateError extends Error {
  constructor() {
    super('the memory process state is not a process state')
    this.name = 'InvalidProcessStateError'
  }
}

export interface MemoryProcess extends Process {
  readonly state: () => ProcessState
}

const namesAPath = (entry: unknown): boolean => {
  if (typeof entry !== 'object' || entry === null || !('invocation' in entry)) return false
  const { invocation } = entry
  if (typeof invocation !== 'object' || invocation === null || !('program' in invocation)) return false
  const { program } = invocation
  if (typeof program !== 'object' || program === null || !('package' in program)) return false
  return typeof program.package === 'string' && isPathPackage(program.package)
}

export const createMemoryProcess = (state: ProcessState): MemoryProcess => {
  const entries: unknown = state.entries
  for (const entry of Array.isArray(entries) ? state.entries : []) {
    if (namesAPath(entry)) throw new PathProgramIdentityError(entry.invocation)
  }
  const parsed = parseProcessState(state)
  if (parsed === undefined) throw new InvalidProcessStateError()
  const table = new Map<string, ExecutionJson>()
  for (const entry of parsed.entries) {
    const repeated = repeatedInputPath(entry.invocation)
    if (repeated !== undefined) throw new RepeatedInputPathError(entry.invocation, repeated)
    const key = invocationKey(entry.invocation)
    if (table.has(key)) throw new DuplicateInvocationError(entry.invocation)
    table.set(key, entry.execution)
  }
  return {
    execute: invocation => {
      const json = invocationToJson(invocation)
      const repeated = repeatedInputPath(json)
      if (repeated !== undefined) return Promise.reject(new RepeatedInputPathError(json, repeated))
      const execution = table.get(invocationKey(json))
      if (execution === undefined) return Promise.reject(new UnknownInvocationError(json))
      return Promise.resolve(executionFromJson(execution))
    },
    state: () => state,
  }
}
