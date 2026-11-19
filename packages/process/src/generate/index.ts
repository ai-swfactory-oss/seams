import { NonEmptyDirectoryError } from '@ai-swfactory-oss/files'

import { executionToJson, invocationCall, invocationFromJson } from '../domain/json'
import type { Invocation, InvocationJson, Process, ProcessEntryJson, ProcessState } from '../types'

export interface ProcessRun {
  readonly invocation: InvocationJson
  readonly location: string
}

export interface ProcessGeneration {
  readonly runs: readonly ProcessRun[]
}

interface CheckedRun {
  readonly json: InvocationJson
  readonly invocation: Invocation
}

const checkedRunOf = (run: ProcessRun, index: number): CheckedRun => {
  const checked = invocationFromJson(run.invocation, run.location)
  if (checked.kind === 'non-empty-directory') {
    throw new NonEmptyDirectoryError('generateProcessEntries', `run ${String(index + 1)} (${invocationCall(run.invocation)})`, checked.path)
  }
  return { json: run.invocation, invocation: checked.invocation }
}

export const generateProcessEntries = async (call: ProcessGeneration, ports: { readonly process: Process }): Promise<ProcessState> => {
  const runs = call.runs.map(checkedRunOf)
  const entries: ProcessEntryJson[] = []
  for (const run of runs) {
    const execution = await ports.process.execute(run.invocation)
    entries.push({ invocation: run.json, execution: executionToJson(execution) })
  }
  return { entries }
}
