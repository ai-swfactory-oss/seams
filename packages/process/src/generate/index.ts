import type { NonEmptyDirectory } from '@ai-swfactory-oss/files'

import { executionToJson, invocationFromJson } from '../domain/json'
import type { Invocation, InvocationJson, Process, ProcessEntryJson, ProcessState } from '../types'

export interface ProcessRun {
  readonly invocation: InvocationJson
  readonly location: string
}

export interface ProcessGeneration {
  readonly runs: readonly ProcessRun[]
}

export type RefusedRun = NonEmptyDirectory & { readonly run: number }

export type GeneratedProcessEntries = { readonly kind: 'entries'; readonly state: ProcessState } | RefusedRun

interface CheckedRun {
  readonly json: InvocationJson
  readonly invocation: Invocation
}

type CheckedRuns = { readonly kind: 'runs'; readonly runs: readonly CheckedRun[] } | RefusedRun

const checkedRunsOf = (runs: readonly ProcessRun[]): CheckedRuns => {
  const checkedRuns: CheckedRun[] = []
  for (const [index, run] of runs.entries()) {
    const checked = invocationFromJson(run.invocation, run.location)
    if (checked.kind === 'non-empty-directory') return { ...checked, run: index + 1 }
    checkedRuns.push({ json: run.invocation, invocation: checked.invocation })
  }
  return { kind: 'runs', runs: checkedRuns }
}

export const generateProcessEntries = async (
  call: ProcessGeneration,
  ports: { readonly process: Process },
): Promise<GeneratedProcessEntries> => {
  const checked = checkedRunsOf(call.runs)
  if (checked.kind === 'non-empty-directory') return checked
  const entries: ProcessEntryJson[] = []
  for (const run of checked.runs) {
    const execution = await ports.process.execute(run.invocation)
    entries.push({ invocation: run.json, execution: executionToJson(execution) })
  }
  return { kind: 'entries', state: { entries } }
}
