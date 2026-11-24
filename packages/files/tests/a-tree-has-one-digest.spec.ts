import { describe, expect, it } from 'vitest'

import { contentIntegrity, type Tree, treeDigest } from '../src/index'

const text = (value: string): Uint8Array => new TextEncoder().encode(value)

const INTEGRITY_OF_ABC = 'sha256-ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

const INTEGRITY_OF_NOTHING = 'sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

const FILES_ONLY: Tree = {
  entries: [
    { path: 'index.html', kind: 'file', content: text('abc'), executable: true },
    { path: 'about/index.html', kind: 'file', content: text(''), executable: false },
    { path: 'README', kind: 'file', content: text('abc'), executable: false },
  ],
}

const FILES_ONLY_DIGEST = 'sha256-45e6f8d59d5513697e67e490c37251223487993372f25dd8475f6b2df5aeb74d'

const WITH_LINK_AND_EMPTY_DIRECTORY: Tree = {
  entries: [
    { path: 'run', kind: 'file', content: text('abc'), executable: true },
    { path: 'link', kind: 'symlink', target: 'run' },
    { path: 'empty', kind: 'directory' },
  ],
}

const WITH_LINK_AND_EMPTY_DIRECTORY_DIGEST = 'sha256-0622b9176e169395daa6f13c06d2898e2ba6233fc95d75a94d1491d8202dc3ab'

describe('a Tree has one digest', () => {
  it('gives each file content its sha256 integrity', async () => {
    expect([await contentIntegrity(text('abc')), await contentIntegrity(text(''))]).toEqual([INTEGRITY_OF_ABC, INTEGRITY_OF_NOTHING])
  })

  it('digests a Tree of files only to the pinned digest of its executable-marked lines in code-unit path order', async () => {
    expect(await treeDigest(FILES_ONLY)).toBe(FILES_ONLY_DIGEST)
  })

  it('digests a Tree with a symlink and an empty directory to the pinned digest of their lines among the file lines', async () => {
    expect(await treeDigest(WITH_LINK_AND_EMPTY_DIRECTORY)).toBe(WITH_LINK_AND_EMPTY_DIRECTORY_DIGEST)
  })

  it('changes the digest when a symlink target, a directory path or an executable flag changes', async () => {
    const variants: readonly Tree[] = [
      { entries: WITH_LINK_AND_EMPTY_DIRECTORY.entries.map(entry => (entry.kind === 'symlink' ? { ...entry, target: 'other' } : entry)) },
      { entries: WITH_LINK_AND_EMPTY_DIRECTORY.entries.map(entry => (entry.kind === 'directory' ? { ...entry, path: 'vacant' } : entry)) },
      { entries: WITH_LINK_AND_EMPTY_DIRECTORY.entries.map(entry => (entry.kind === 'file' ? { ...entry, executable: false } : entry)) },
    ]

    const digests = await Promise.all(variants.map(treeDigest))

    expect(digests.filter(digest => digest === WITH_LINK_AND_EMPTY_DIRECTORY_DIGEST)).toEqual([])
  })

  it('gives the same digest for the same entries in another order', async () => {
    expect(await treeDigest({ entries: [...FILES_ONLY.entries].reverse() })).toBe(FILES_ONLY_DIGEST)
  })

  it("a tree's digest does not depend on its files' link counts", async () => {
    const counted: Tree = {
      entries: FILES_ONLY.entries.map((entry, index) => (entry.kind === 'file' ? { ...entry, links: index + 2 } : entry)),
    }

    expect(await treeDigest(counted)).toBe(FILES_ONLY_DIGEST)
  })
})
