import { closeSync, constants, fstatSync, openSync, type Stats } from 'node:fs'
import { chmod, lstat, mkdir, open, readdir, readFile, readlink, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { Socket } from 'node:net'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

import { applyInOrder } from '../domain/apply'
import { isWithin, joinPath, normalisePath, parentsOf } from '../domain/path'
import { NO_LINES } from '../domain/pipe-readers'
import { selectionMatcher } from '../domain/selection'
import { listedTree } from '../domain/volume'
import type { Change, FailedChange, Files, KnownChangeFailure, Selection, Snapshot, TreeEntry, WriteLineOutcome } from '../types'

export interface NodeFilesOptions {
  readonly root: string
}

const KNOWN: Readonly<Record<string, KnownChangeFailure>> = {
  ENOENT: 'not-found',
  ENOTDIR: 'not-a-directory',
  EISDIR: 'is-a-directory',
  EEXIST: 'exists',
  ENOTEMPTY: 'exists',
  EACCES: 'permission-denied',
  EPERM: 'permission-denied',
}

const failed = (reason: KnownChangeFailure): FailedChange => ({ kind: 'failed', reason })

const codeOf = (error: unknown): string => {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') return error.code
  return error instanceof Error ? error.name : typeof error
}

const failureOf = (error: unknown): FailedChange => {
  const code = codeOf(error)
  const reason = KNOWN[code]
  return reason === undefined ? { kind: 'failed', reason: 'unrecognised', code } : failed(reason)
}

type Found = { readonly kind: 'absent' } | { readonly kind: 'found'; readonly stats: Stats } | FailedChange

const ABSENT: Found = { kind: 'absent' }

const EXECUTABLE = 0o755
const REGULAR = 0o644

const NOT_A_PIPE: WriteLineOutcome = { kind: 'failed', reason: 'not-a-pipe' }
const NO_READER: WriteLineOutcome = { kind: 'no-reader' }
const WRITTEN: WriteLineOutcome = { kind: 'written' }

const isExecutable = (stats: Stats): boolean => (stats.mode & 0o100) !== 0

const statOf = async (absolute: string): Promise<Found> => {
  try {
    return { kind: 'found', stats: await lstat(absolute) }
  } catch (error: unknown) {
    const failure = failureOf(error)
    return failure.reason === 'not-found' || failure.reason === 'not-a-directory' ? ABSENT : failure
  }
}

const isDirectory = (found: Found): boolean => found.kind === 'found' && found.stats.isDirectory()

const pipeDescriptor = (absolute: string): number | undefined => {
  try {
    const descriptor = openSync(absolute, constants.O_RDWR | constants.O_NONBLOCK)
    if (fstatSync(descriptor).isFIFO()) return descriptor
    closeSync(descriptor)
    return undefined
  } catch {
    return undefined
  }
}

const linesOf = (descriptor: number, signal: AbortSignal): AsyncIterable<string> => {
  const socket = new Socket({ fd: descriptor, readable: true, writable: false })
  const lines = createInterface({ input: socket, crlfDelay: Infinity })
  const iterator = lines[Symbol.asyncIterator]()
  const close = (): void => {
    lines.close()
    socket.destroy()
  }
  signal.addEventListener('abort', close, { once: true })
  return {
    [Symbol.asyncIterator]: () => ({
      next: () => iterator.next(),
      return: () => {
        signal.removeEventListener('abort', close)
        close()
        return Promise.resolve({ done: true, value: undefined })
      },
    }),
  }
}

const nodeFilesOf = (root: string): Files => {
  const at = (path: string): string => (path === '' ? root : join(root, path))

  const entryAt = async (path: string): Promise<Found> => {
    for (const parent of parentsOf(path)) {
      const found = await statOf(at(parent))
      if (found.kind === 'failed') return found
      if (!isDirectory(found)) return ABSENT
    }
    return statOf(at(path))
  }

  const parentFailure = async (path: string): Promise<FailedChange | undefined> => {
    for (const parent of parentsOf(path)) {
      const found = await statOf(at(parent))
      if (found.kind === 'failed') return found
      if (found.kind === 'absent') return undefined
      if (!found.stats.isDirectory()) return failed('not-a-directory')
    }
    return undefined
  }

  const makeParents = async (path: string): Promise<void> => {
    const [parent] = parentsOf(path).slice(-1)
    if (parent !== undefined) await mkdir(at(parent), { recursive: true })
  }

  const walk = async (directory: string, selects: (path: string) => boolean, into: TreeEntry[]): Promise<void> => {
    const names = await readdir(at(directory))
    for (const name of names) {
      const path = joinPath(directory, name)
      const stats = await lstat(at(path))
      if (stats.isDirectory()) {
        into.push({ path, kind: 'directory' })
        await walk(path, selects, into)
      } else if (stats.isSymbolicLink()) {
        into.push({ path, kind: 'symlink', target: await readlink(at(path)) })
      } else if (stats.isFile()) {
        const content = selects(path) ? new Uint8Array(await readFile(at(path))) : new Uint8Array()
        into.push({ path, kind: 'file', content, executable: isExecutable(stats) })
      }
    }
  }

  const EMPTY: Snapshot = { kind: 'snapshot', tree: { entries: [] } }

  const readTree = async (selection: Selection): Promise<Snapshot> => {
    const selects = selectionMatcher(selection)
    const start = normalisePath(selection.root)
    if (selects === undefined || start === undefined) return EMPTY
    const found = await entryAt(start)
    if (found.kind === 'failed') return found
    if (!isDirectory(found)) return EMPTY
    const entries: TreeEntry[] = []
    await walk(start, selects, entries)
    return { kind: 'snapshot', tree: listedTree(entries, selects) }
  }

  const snapshot = async (selection: Selection): Promise<Snapshot> => {
    try {
      return await readTree(selection)
    } catch (error: unknown) {
      return failureOf(error)
    }
  }

  const write = async (path: string, content: Uint8Array, executable: boolean): Promise<FailedChange | undefined> => {
    const existing = await entryAt(path)
    if (existing.kind === 'failed') return existing
    if (isDirectory(existing)) return failed('is-a-directory')
    const failure = await parentFailure(path)
    if (failure !== undefined) return failure
    await makeParents(path)
    if (existing.kind === 'found') await rm(at(path))
    const mode = executable ? EXECUTABLE : REGULAR
    await writeFile(at(path), content, { mode })
    await chmod(at(path), mode)
    return undefined
  }

  const link = async (path: string, target: string): Promise<FailedChange | undefined> => {
    const existing = await entryAt(path)
    if (existing.kind === 'failed') return existing
    if (existing.kind === 'found') return failed('exists')
    const failure = await parentFailure(path)
    if (failure !== undefined) return failure
    await makeParents(path)
    await symlink(target, at(path))
    return undefined
  }

  const makeDirectory = async (path: string): Promise<FailedChange | undefined> => {
    const existing = await entryAt(path)
    if (existing.kind === 'failed') return existing
    if (isDirectory(existing)) return undefined
    if (existing.kind === 'found') return failed('exists')
    const failure = await parentFailure(path)
    if (failure !== undefined) return failure
    await mkdir(at(path), { recursive: true })
    return undefined
  }

  const remove = async (path: string): Promise<FailedChange | undefined> => {
    const existing = await entryAt(path)
    if (existing.kind === 'failed') return existing
    if (existing.kind === 'absent') return failed('not-found')
    await rm(at(path), { recursive: true })
    return undefined
  }

  const move = async (rawFrom: string, rawTo: string): Promise<FailedChange | undefined> => {
    const from = normalisePath(rawFrom)
    const to = normalisePath(rawTo)
    if (from === undefined || to === undefined || from === '' || to === '' || isWithin(to, from)) return failed('invalid-path')
    const source = await entryAt(from)
    if (source.kind === 'failed') return source
    if (source.kind === 'absent') return failed('not-found')
    const target = await entryAt(to)
    if (target.kind === 'failed') return target
    if (target.kind === 'found') return failed('exists')
    const failure = await parentFailure(to)
    if (failure !== undefined) return failure
    await makeParents(to)
    await rename(at(from), at(to))
    return undefined
  }

  const stepOf = (change: Change): Promise<FailedChange | undefined> => {
    if (change.kind === 'move') return move(change.from, change.to)
    const path = normalisePath(change.path)
    if (path === undefined || path === '') return Promise.resolve(failed('invalid-path'))
    switch (change.kind) {
      case 'write':
        return write(path, change.content, change.executable)
      case 'symlink':
        return link(path, change.target)
      case 'mkdir':
        return makeDirectory(path)
      case 'delete':
        return remove(path)
      case 'pipe':
        return Promise.resolve(failed('unsupported'))
    }
  }

  const step = async (change: Change): Promise<FailedChange | undefined> => {
    try {
      return await stepOf(change)
    } catch (error: unknown) {
      return failureOf(error)
    }
  }

  const readLines = (path: string, { signal }: { readonly signal: AbortSignal }): AsyncIterable<string> => {
    const normalised = normalisePath(path)
    if (signal.aborted || normalised === undefined || normalised === '') return NO_LINES
    const descriptor = pipeDescriptor(at(normalised))
    return descriptor === undefined ? NO_LINES : linesOf(descriptor, signal)
  }

  const writeLine = async (path: string, line: string): Promise<WriteLineOutcome> => {
    const normalised = normalisePath(path)
    if (normalised === undefined || normalised === '') return NOT_A_PIPE
    const found = await entryAt(normalised)
    if (found.kind !== 'found' || !found.stats.isFIFO()) return NOT_A_PIPE
    try {
      const handle = await open(at(normalised), constants.O_WRONLY | constants.O_NONBLOCK)
      try {
        await handle.write(`${line}\n`)
      } finally {
        await handle.close()
      }
      return WRITTEN
    } catch (error: unknown) {
      return codeOf(error) === 'ENXIO' ? NO_READER : NOT_A_PIPE
    }
  }

  return { snapshot, apply: changes => applyInOrder(changes, step), readLines, writeLine }
}

export const createNodeFiles = (options: NodeFilesOptions): Files => nodeFilesOf(options.root)
