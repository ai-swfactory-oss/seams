import { executionToJson, invocationFromJson } from '../domain/json'
import type { InvocationJson, Process, ProcessEntryJson, ProcessState } from '../types'

export interface ProcessRun {
  readonly invocation: InvocationJson
  readonly location: string
}

export interface ProcessGeneration {
  readonly runs: readonly ProcessRun[]
}

export const generateProcessEntries = async (call: ProcessGeneration, ports: { readonly process: Process }): Promise<ProcessState> => {
  const entries: ProcessEntryJson[] = []
  for (const run of call.runs) {
    const execution = await ports.process.execute(invocationFromJson(run.invocation, run.location))
    entries.push({ invocation: run.invocation, execution: executionToJson(execution) })
  }
  return { entries }
}
