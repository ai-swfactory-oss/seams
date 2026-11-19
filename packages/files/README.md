# @ai-swfactory-oss/files

The files port: a rooted snapshot in, a list of changes out. Its memory adapter holds one Tree, and its generator records results from a real adapter.

## A Tree has one digest

`treeDigest(tree)` gives a Tree's digest. It is a pure function computed with `crypto.subtle.digest` and the hex encoding of `@ai-swfactory-oss/bytes`. `contentIntegrity(content)` gives one file's integrity.

- **File integrity:** `sha256-` followed by the lowercase hex of the SHA-256 of the file's content.
- **Lines:** each entry of the Tree gives one line. The lines are sorted by path, comparing UTF-16 code units, not by locale.
- **Line forms:** `\0` is a NUL byte and `\n` a newline. There are four:
  - an executable file: `<path>\0<integrity>\0x\n`
  - any other file: `<path>\0<integrity>\0-\n`
  - a symlink: `<path>\0symlink\0<target>\0l\n`
  - a directory entry, which is always an empty directory: `<path>\0directory\0d\n`
- **The digest:** the file integrity computed over the UTF-8 bytes of the sorted lines joined with nothing between them.

A Tree of files only digests to exactly the fixed file-set scheme. The digest does not depend on the order of the Tree's entries.

The lines cannot be confused with one another. A path or a target holds no NUL. A file's second field always starts with `sha256-`, while the other forms have the word `symlink` or `directory` there. Every line ends with a one-character marker (`x`, `-`, `l` or `d`) and a newline.

## Licence

MIT
