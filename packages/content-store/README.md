# @ai-swfactory-oss/content-store

A content-addressed store of Trees, as a pure library over the files port of `@ai-swfactory-oss/files`.

- `createContentStoreSdk({ root }, { files })` is the only entry that takes a port. The store's root directory is data, so two stores with different roots on one files port keep apart. A root that is not a valid relative path, such as `../x` or `/abs`, gives no store: the entry returns `{ kind: 'refused', reason: 'invalid-root', root }` naming that root.
- `put(tree)` stores a Tree under `<root>/<digest>` and returns `{ kind: 'stored', digest }`. The digest is the Tree digest `treeDigest` of `@ai-swfactory-oss/files`; this package has no hash or digest of its own. Putting a Tree that is already stored changes nothing. Whatever else is at `<root>/<digest>` is replaced. When the files port fails a snapshot or a change, `put` returns the port's failure as it came, `{ kind: 'failed', reason }`.
- `put` refuses, as `{ kind: 'refused', reason, path }`, a Tree that `get` could not give back equal: an entry path not in normal form (`path-not-normal`), a path given twice (`duplicate-path`), entries not in path order (`out-of-order`), a directory entry with entries beneath it (`non-empty-directory`), or an entry beneath a file or symlink (`not-a-directory`). It writes nothing for a refused Tree.
- `get(digest)` returns `{ kind: 'tree', tree }` with the Tree stored under that digest, its entries in path order, or `{ kind: 'missing' }` when nothing is stored there, a file or symlink is there instead of a directory, or what is stored no longer digests to it. When the files port fails the snapshot, `get` returns that failure, `{ kind: 'failed', reason }`.

An empty Tree can be stored: its digest directory is kept as an empty directory, and getting its digest returns an empty Tree.

## Licence

MIT
