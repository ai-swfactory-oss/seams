# @ai-swfactory-oss/archive

A pure tar, gzip and raw deflate library over bytes and the Trees of `@ai-swfactory-oss/files`. It takes no port: disk access is the caller's, who passes a files snapshot Tree in and applies the changes it gets back through the files port.

- `packTar(tree)` packs a Tree into ustar bytes: files with their executable bit, symlinks, directories and named pipes. A path that does not fit the ustar name and prefix fields, or a symlink target longer than the link field, goes in a pax record. Owners, times and modes other than the executable bit are fixed, so the same Tree packs to the same bytes.
- `unpackTar(bytes)` gives back `{ kind: 'tree', tree }`, its entries in path order, or `{ kind: 'malformed', reason, offset }` at the first header it cannot read. A directory entry with entries beneath it is not listed, as in a files snapshot, and of two entries at one path the later one wins.
- `extractTar(bytes, at)` gives back `{ kind: 'changes', changes }`: the files-port changes that put the unpacked Tree under the folder `at`, for the caller to pass to `files.apply`. Its failures are those of `unpackTar`.
- `gzip(bytes)` and `gunzip(bytes, limit?)` frame raw deflate as single-member gzip: a header with mtime 0 and OS byte 255, and a CRC-32 and size trailer. `deflateRaw(bytes)` and `inflateRaw(bytes, limit?)` are the raw streams. Compression is the platform's `CompressionStream` and `DecompressionStream` with `'deflate-raw'`.
- `listTgz(bytes, { maxBytes, maxEntries })` lists the entries of a .tgz, each `{ path, kind, size }`. It fails closed: a .tgz, or the tar it inflates to, over `maxBytes` gives `{ kind: 'too-large', limit }`; more than `maxEntries` entries gives `{ kind: 'too-many-entries', limit }`; a malformed gzip or tar header gives `{ kind: 'malformed', … }`. It never returns a partial list.

Archive bytes are not content-stable across runtimes, because deflate output may differ between platforms. Content addressing hashes the Tree, never the archive.

## Known limitations

- `gunzip` reads single-member gzip only; a second member is invalid.

## Licence

MIT
