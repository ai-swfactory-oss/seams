import type { FilesGeneration, FilesResults } from '../src/generate/index'
import {
  type ChangeOutcome,
  type KnownChangeFailure,
  parseChangesJson,
  parseTreeJson,
  type Selection,
  type WriteLineOutcome,
} from '../src/index'
import generated from './generated/node-results.json'

export interface NodeCase {
  readonly name: string
  readonly generation: FilesGeneration
  readonly results: FilesResults
}

interface PipeReading {
  readonly written: readonly WriteLineOutcome[]
  readonly lines: readonly string[]
  readonly ended: boolean
}

interface PipeResults {
  readonly reading: PipeReading
  readonly noReader: WriteLineOutcome
}

interface MalformedCase {
  readonly kind: 'malformed'
  readonly index: number
  readonly part: 'case' | 'generation' | 'results'
}

export type NodeCasesReading = { readonly kind: 'cases'; readonly cases: readonly NodeCase[] } | MalformedCase

export type PipeResultsReading = { readonly kind: 'pipe'; readonly pipe: PipeResults } | { readonly kind: 'malformed' }

type CaseReading = { readonly kind: 'case'; readonly found: NodeCase } | MalformedCase

const strings = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every(item => typeof item === 'string') ? value.map(String) : undefined

const selectionOf = (value: unknown): Selection | undefined => {
  if (typeof value !== 'object' || value === null || !('root' in value) || !('include' in value) || !('exclude' in value)) {
    return undefined
  }
  const include = strings(value.include)
  const exclude = strings(value.exclude)
  return typeof value.root === 'string' && include !== undefined && exclude !== undefined
    ? { root: value.root, include, exclude }
    : undefined
}

const KNOWN_FAILURES: readonly KnownChangeFailure[] = [
  'invalid-path',
  'not-found',
  'not-a-directory',
  'is-a-directory',
  'exists',
  'permission-denied',
  'unsupported',
]

const failedOf = (value: object): ChangeOutcome | undefined => {
  if (!('reason' in value)) return undefined
  const { reason: raw } = value
  if (raw === 'unrecognised') {
    return 'code' in value && typeof value.code === 'string' ? { kind: 'failed', reason: 'unrecognised', code: value.code } : undefined
  }
  const reason = KNOWN_FAILURES.find(known => known === raw)
  return reason === undefined ? undefined : { kind: 'failed', reason }
}

const outcomeOf = (value: unknown): ChangeOutcome | undefined => {
  if (typeof value !== 'object' || value === null || !('kind' in value)) return undefined
  if (value.kind === 'applied' || value.kind === 'skipped') return { kind: value.kind }
  return value.kind === 'failed' ? failedOf(value) : undefined
}

const outcomesOf = (value: unknown): ChangeOutcome[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const outcomes: ChangeOutcome[] = []
  for (const item of value) {
    const outcome = outcomeOf(item)
    if (outcome === undefined) return undefined
    outcomes.push(outcome)
  }
  return outcomes
}

const caseOf = (value: unknown, index: number): CaseReading => {
  if (typeof value !== 'object' || value === null || !('name' in value) || !('generation' in value) || !('results' in value)) {
    return { kind: 'malformed', index, part: 'case' }
  }
  const { name, generation, results } = value
  if (typeof name !== 'string' || typeof generation !== 'object' || generation === null) {
    return { kind: 'malformed', index, part: 'generation' }
  }
  if (typeof results !== 'object' || results === null) return { kind: 'malformed', index, part: 'results' }
  const setup = 'setup' in generation ? parseTreeJson(generation.setup) : undefined
  const selection = 'selection' in generation ? selectionOf(generation.selection) : undefined
  const changes = 'changes' in generation ? parseChangesJson(generation.changes) : undefined
  if (setup === undefined || selection === undefined || changes === undefined) return { kind: 'malformed', index, part: 'generation' }
  const snapshot = 'snapshot' in results ? parseTreeJson(results.snapshot) : undefined
  const outcomes = 'outcomes' in results ? outcomesOf(results.outcomes) : undefined
  const after = 'after' in results ? parseTreeJson(results.after) : undefined
  if (snapshot === undefined || outcomes === undefined || after === undefined) return { kind: 'malformed', index, part: 'results' }
  return { kind: 'case', found: { name, generation: { setup, selection, changes }, results: { setup, snapshot, outcomes, after } } }
}

const readNodeCases = (values: readonly unknown[]): NodeCasesReading => {
  const cases: NodeCase[] = []
  for (const [index, value] of values.entries()) {
    const reading = caseOf(value, index)
    if (reading.kind === 'malformed') return reading
    cases.push(reading.found)
  }
  return { kind: 'cases', cases }
}

const writeLineOutcomeOf = (value: unknown): WriteLineOutcome | undefined => {
  if (typeof value !== 'object' || value === null || !('kind' in value)) return undefined
  if (value.kind === 'written' || value.kind === 'no-reader') return { kind: value.kind }
  return value.kind === 'failed' && 'reason' in value && value.reason === 'not-a-pipe'
    ? { kind: 'failed', reason: 'not-a-pipe' }
    : undefined
}

const writeLineOutcomesOf = (value: unknown): WriteLineOutcome[] | undefined => {
  if (!Array.isArray(value)) return undefined
  const outcomes = value.map(writeLineOutcomeOf)
  return outcomes.every((outcome): outcome is WriteLineOutcome => outcome !== undefined) ? outcomes : undefined
}

const MALFORMED_PIPE: PipeResultsReading = { kind: 'malformed' }

const readPipeResults = (value: unknown): PipeResultsReading => {
  if (typeof value !== 'object' || value === null || !('reading' in value) || !('noReader' in value)) return MALFORMED_PIPE
  const { reading, noReader: rawNoReader } = value
  if (typeof reading !== 'object' || reading === null || !('written' in reading) || !('lines' in reading) || !('ended' in reading)) {
    return MALFORMED_PIPE
  }
  const written = writeLineOutcomesOf(reading.written)
  const lines = strings(reading.lines)
  const noReader = writeLineOutcomeOf(rawNoReader)
  if (written === undefined || lines === undefined || typeof reading.ended !== 'boolean' || noReader === undefined) return MALFORMED_PIPE
  return { kind: 'pipe', pipe: { reading: { written, lines, ended: reading.ended }, noReader } }
}

export const NODE_CASES_READING: NodeCasesReading = readNodeCases(generated.cases)

export const NODE_CASES: readonly NodeCase[] = NODE_CASES_READING.kind === 'cases' ? NODE_CASES_READING.cases : []

export const nodeCase = (name: string): NodeCase | undefined => NODE_CASES.find(entry => entry.name === name)

export const PIPE_RESULTS_READING: PipeResultsReading = readPipeResults(generated.pipe)
