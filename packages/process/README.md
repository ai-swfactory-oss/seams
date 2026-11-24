# @ai-swfactory-oss/process

The process port: an invocation in, an execution out, with file changes returned. Its memory adapter answers from a lookup table that ignores the program's location, and its generator records entries from a real adapter.

## The container adapter

`createContainerProcess({ root, engine, images }, { process })`, from `@ai-swfactory-oss/process/container`, runs an invocation in a container and returns the changes it made, in the files port's `Change` type.

- `root` is the absolute directory inside the container that holds the input Tree. The invocation's cwd is relative to it.
- `engine` is `{ program, location }`: the docker or podman CLI. The adapter runs it through the process port it is given, and uses only flags both engines share.
- `images` maps a program identity, written `package@version`, to `{ image, location }`. The adapter runs `location` in `image` and ignores the invocation's own location. An identity with no image is not-started with reason `not-found`.

Each run goes through the engine in this order:

1. `version`, once per adapter: the engine client's OS. On any OS other than linux, macOS included, every run is not-started with reason `unsupported-host`.
2. `create`, with the workdir, the image, its location and the invocation's arguments. The environment goes as `-e NAME` with no value, and the values reach the engine only through that one call's process environment, so no value appears in an argv.
3. `cp -` copies the input Tree into `root` as a tar.
4. `start -a` runs it attached, with the invocation's stdin and time limit.
5. `inspect` reads the container's state. When the time limit fired after the process had already exited, the run ends `exited` with its exit code.
6. `diff` lists the entries of the container's upper layer, and `cp` copies `root` out as a tar, read with `@ai-swfactory-oss/archive`.
7. `rm -f` removes the container. It always runs once the container exists, also after a failure or a timeout.

Changes always come from an overlay, because the container's own filesystem is one. A path the run deleted, or the input copied in and then deleted, becomes a delete. A file whose bytes and executable bit are unchanged gives no change, and one whose executable bit alone changed is written again with its new bit.

Real-engine runs are generated in ai-swfactory-oss/seams#69.

## Licence

MIT
