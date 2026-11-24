import { encodeHex } from '@ai-swfactory-oss/bytes'

import type { Tree, TreeEntry } from '../types'
import { comparePaths } from './path'

const encoder = new TextEncoder()

export const contentIntegrity = async (content: Uint8Array): Promise<string> =>
  `sha256-${encodeHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(content))))}`

const lineOf = async (entry: TreeEntry): Promise<string> => {
  if (entry.kind === 'symlink') return `${entry.path}\0symlink\0${entry.target}\0l\n`
  if (entry.kind === 'directory') return `${entry.path}\0directory\0d\n`
  if (entry.kind === 'pipe') return `${entry.path}\0pipe\0p\n`
  return `${entry.path}\0${await contentIntegrity(entry.content)}\0${entry.executable ? 'x' : '-'}\n`
}

export const treeDigest = async (tree: Tree): Promise<string> => {
  const lines = await Promise.all([...tree.entries].sort((a, b) => comparePaths(a.path, b.path)).map(lineOf))
  return contentIntegrity(encoder.encode(lines.join('')))
}
