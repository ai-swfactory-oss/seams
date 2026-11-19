import { executionFromJson, invocationKey, invocationToJson } from '../domain/json'
import type { ExecutionJson, InvocationJson, Process, ProcessState } from '../types'

export class UnknownInvocationError extends Error {
  constructor(readonly invocation: InvocationJson) {
    super(`no entry for ${invocation.program.package}@${invocation.program.version} ${invocation.args.join(' ')}`)
    this.name = 'UnknownInvocationError'
  }
}

export class DuplicateInvocationError extends Error {
  constructor(readonly invocation: InvocationJson) {
    super(`two entries for ${invocation.program.package}@${invocation.program.version} ${invocation.args.join(' ')}`)
    this.name = 'DuplicateInvocationError'
  }
}

export interface MemoryProcess extends Process {
  readonly state: () => ProcessState
}

export const createMemoryProcess = (state: ProcessState): MemoryProcess => {
  const table = new Map<string, ExecutionJson>()
  for (const entry of state.entries) {
    const key = invocationKey(entry.invocation)
    if (table.has(key)) throw new DuplicateInvocationError(entry.invocation)
    table.set(key, entry.execution)
  }
  return {
    execute: invocation => {
      const json = invocationToJson(invocation)
      const execution = table.get(invocationKey(json))
      if (execution === undefined) return Promise.reject(new UnknownInvocationError(json))
      return Promise.resolve(executionFromJson(execution))
    },
    state: () => state,
  }
}
