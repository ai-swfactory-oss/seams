import process from 'node:process'
import type { Readable, Writable } from 'node:stream'

import { takeLine } from '../domain/lines'
import type { Terminal, TerminalStream, WriteOutcome } from '../index'

const WRITTEN: WriteOutcome = { kind: 'written' }
const CLOSED: WriteOutcome = { kind: 'closed' }

const readerGone = (error: Error): boolean => 'code' in error && (error.code === 'EPIPE' || error.code === 'ERR_STREAM_DESTROYED')

const ignoreError = (): void => undefined

const writeTo = (target: Writable, text: string): Promise<WriteOutcome> =>
  new Promise((resolve, reject) => {
    if (!target.writable) {
      resolve(CLOSED)
      return
    }
    target.write(text, error => {
      if (error == null) resolve(WRITTEN)
      else if (readerGone(error)) resolve(CLOSED)
      else reject(error)
    })
  })

const nextChunk = (source: Readable): Promise<string | undefined> =>
  new Promise((resolve, reject) => {
    if (source.errored !== null) {
      reject(source.errored)
      return
    }
    const attempt = (): void => {
      const chunk: unknown = source.read()
      if (typeof chunk === 'string') {
        settle(chunk)
      } else if (source.readableEnded) {
        settle(undefined)
      }
    }
    const onError = (error: Error): void => {
      detach()
      reject(error)
    }
    const onEnd = (): void => {
      settle(undefined)
    }
    const detach = (): void => {
      source.off('readable', attempt)
      source.off('end', onEnd)
      source.off('error', onError)
    }
    const settle = (value: string | undefined): void => {
      detach()
      resolve(value)
    }
    source.on('readable', attempt)
    source.once('end', onEnd)
    source.once('error', onError)
    attempt()
  })

const readerOf = (source: Readable): Pick<Terminal, 'readLine' | 'readAll'> => {
  let buffered = ''
  return {
    readLine: async () => {
      while (!buffered.includes('\n')) {
        const chunk = await nextChunk(source)
        if (chunk === undefined) break
        buffered += chunk
      }
      const { line, rest } = takeLine(buffered)
      buffered = rest
      return line
    },
    readAll: async () => {
      for (let chunk = await nextChunk(source); chunk !== undefined; chunk = await nextChunk(source)) {
        buffered += chunk
      }
      const all = buffered
      buffered = ''
      return all
    },
  }
}

export const createNodeTerminal = (): Terminal => {
  process.stdin.setEncoding('utf8')
  const targets: Readonly<Record<TerminalStream, Writable>> = { stdout: process.stdout, stderr: process.stderr }
  targets.stdout.on('error', ignoreError)
  targets.stderr.on('error', ignoreError)
  return {
    write: (stream, text) => writeTo(targets[stream], text),
    ...readerOf(process.stdin),
  }
}
