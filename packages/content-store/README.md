# @ai-swfactory-oss/content-store

A content-addressed store of Trees, as a pure library over the files port of `@ai-swfactory-oss/files`.

- `createContentStore({ root }, { files })` is the only entry that takes a port. The store's root directory is data, so two stores with different roots on one files port keep apart.
- `put(tree)` stores a Tree under `<root>/<digest>` and returns `{ kind: 'stored', digest }`. The digest is the Tree digest `treeDigest` of `@ai-swfactory-oss/files`; this package has no hash or digest of its own. Putting a Tree that is already stored changes nothing. When the files port refuses a change, `put` returns `{ kind: 'failed', reason }` with the port's reason.
- `get(digest)` returns `{ kind: 'tree', tree }` with the Tree stored under that digest, its entries in path order, or `{ kind: 'missing' }` when nothing is stored there or what is stored no longer digests to it.

An empty Tree can be stored: its digest directory is kept as an empty directory, and getting its digest returns an empty Tree.

## Licence

MIT
