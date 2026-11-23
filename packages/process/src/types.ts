import type { Change, ChangeJson, DuplicatePath, NonEmptyDirectory, Tree, TreeJson } from '@ai-swfactory-oss/files'

export interface ProgramIdentity {
  readonly package: string
  readonly version: string
}

export interface NativeTargetsLocation {
  readonly anchor: string
  readonly targets: Readonly<Record<string, string>>
  readonly env: Readonly<Record<string, string>>
}

export interface ModuleEntryLocation {
  readonly anchor: string
  readonly module: string
}

export type Location = NativeTargetsLocation | ModuleEntryLocation | string

export type CheckedLocation =
  | { readonly kind: 'location'; readonly location: Location }
  | { readonly kind: 'unknown-location'; readonly location: string }
  | { readonly kind: 'unknown-target'; readonly target: string }

export type LocationRefusal = Exclude<CheckedLocation, { readonly kind: 'location' }>

export interface Invocation {
  readonly program: ProgramIdentity
  readonly location: Location
  readonly args: readonly string[]
  readonly cwd: string
  readonly env: Readonly<Record<string, string>>
  readonly input: Tree
  readonly stdin?: Uint8Array
  readonly timeLimitMs?: number
}

export type Ending =
  | { readonly kind: 'exited'; readonly exitCode: number }
  | { readonly kind: 'timed-out' }
  | { readonly kind: 'signalled'; readonly signal: string }

export interface Streams {
  readonly stdout: Uint8Array
  readonly stderr: Uint8Array
}

export interface NotStarted {
  readonly kind: 'not-started'
  readonly reason: NotStartedReason
  readonly message: string
}

export type Execution = (Ending & Streams & { readonly changes: readonly Change[] }) | NotStarted

export type NotStartedReason = 'not-found' | 'permission-denied' | 'other'

export interface Process {
  readonly execute: (invocation: Invocation) => Promise<Execution>
}

export interface InvocationJson {
  readonly program: ProgramIdentity
  readonly args: readonly string[]
  readonly cwd: string
  readonly env: Readonly<Record<string, string>>
  readonly input: TreeJson
  readonly stdin?: string
  readonly timeLimitMs?: number
}

export type CheckedInvocation =
  | { readonly kind: 'invocation'; readonly invocation: Invocation }
  | NonEmptyDirectory
  | DuplicatePath
  | LocationRefusal

export type ExecutionJson =
  | (Ending & { readonly stdout: string; readonly stderr: string; readonly changes: readonly ChangeJson[] })
  | NotStarted

export interface ProcessEntryJson {
  readonly invocation: InvocationJson
  readonly execution: ExecutionJson
}

export interface ProcessState {
  readonly entries: readonly ProcessEntryJson[]
}
