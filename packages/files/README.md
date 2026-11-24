# @ai-swfactory-oss/files

The files port: a rooted snapshot in, a list of changes out. Its memory adapter holds one Tree, and its generator records results from a real adapter.

## A Tree has one digest

`treeDigest(tree)` gives a Tree's digest. It is a pure function computed with `crypto.subtle.digest` and the hex encoding of `@ai-swfactory-oss/bytes`. `contentIntegrity(content)` gives one file's integrity.

- **File integrity:** `sha256-` followed by the lowercase hex of the SHA-256 of the file's content.
- **Lines:** each entry of the Tree gives one line. The lines are sorted by path, comparing UTF-16 code units, not by locale.
- **Line forms:** `\0` is a NUL byte and `\n` a newline. There are five:
  - an executable file: `<path>\0<integrity>\0x\n`
  - any other file: `<path>\0<integrity>\0-\n`
  - a symlink: `<path>\0symlink\0<target>\0l\n`
  - a directory entry, which is always an empty directory: `<path>\0directory\0d\n`
  - a named pipe: `<path>\0pipe\0p\n`
- **The digest:** the file integrity computed over the UTF-8 bytes of the sorted lines joined with nothing between them.

A Tree of files only digests to exactly the fixed file-set scheme. The digest does not depend on the order of the Tree's entries.

The lines cannot be confused with one another. A path or a target holds no NUL. A file's second field always starts with `sha256-`, while the other forms have the word `symlink`, `directory` or `pipe` there. Every line ends with a one-character marker (`x`, `-`, `l`, `d` or `p`) and a newline.

## Named pipes

A `{kind: 'pipe', path}` change makes a named pipe, and fails with `exists` on a path that exists.

- `readLines(path, {signal})` yields each line written to the pipe, in order and without its newline, until `signal` aborts.
- `writeLine(path, line)` never blocks. It resolves `{kind: 'written'}` when a reader holds the pipe, and `{kind: 'no-reader'}` at once when none does; that line is dropped. On a path that is not a named pipe it resolves `{kind: 'failed', reason: 'not-a-pipe'}`.

## The node adapter

`createNodeFiles({ root })`, from `@ai-swfactory-oss/files/node`, is the files port over the disk under the absolute folder `root`. Every path the port takes is relative to it.

- **Snapshot:** the files, symlinks and empty directories under the selection's root that its include and exclude patterns select, sorted by path. Each file carries its content and whether its owner may execute it. A symlink is listed with its target and never followed, so a root that is a symlink selects nothing. The snapshot is answered as `{ kind: 'snapshot', tree }`, or, when the disk cannot be read, as failed with its reason in the same form a failed change takes.
- **Apply:** each change in order, answered by one outcome: applied, failed with its reason, or skipped once an earlier change has failed. A failure the disk reports with a code the port has no reason for is answered as `unrecognised`, carrying that code.
  - A write replaces a file or symlink at its path, sets the mode to `0755` or `0644`, and creates missing parent directories.
  - A path under a file or a symlink fails with `not-a-directory`, so no change reaches outside `root` through a symlink.
  - A delete removes a directory with everything under it, and a move renames in one step.
  - A `pipe` change fails with `unsupported`: Node has no call that creates a named pipe, and ai-swfactory-oss/seams#131 moves creating one to the process port.
- **Named pipes:** `readLines` opens a named pipe on the disk for reading and writing, so it never waits for a writer and never ends until its signal aborts. `writeLine` opens the pipe for writing without blocking and answers `no-reader` when no reader holds it.

The memory adapter gives the same results: `tests/generated/node-results.json` records real runs of the node adapter, and a spec replays each of them over the memory adapter. The `pipe` change is the one result it names as different.

## Licence

MIT
