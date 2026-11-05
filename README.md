# seams

The seams hub: environment-neutral ports, fakes and contracts, plus the Node runtime capabilities (host, process, logger, module, http-server) and shared in-process helpers.

This repository holds only a guarded skeleton for now. Each package's code arrives by migration from the private monorepo `ai-swfactory/seams`.

## Packages

- `@ai-swfactory-oss/seams`: environment-neutral ports, fakes and contracts.
- `@ai-swfactory-oss/seams-host`: the Node host capability.
- `@ai-swfactory-oss/seams-process`: the Node process capability.
- `@ai-swfactory-oss/seams-logger`: the Node logger capability.
- `@ai-swfactory-oss/seams-module`: the Node module capability.
- `@ai-swfactory-oss/seams-http-server`: the Node HTTP server capability.
- `@ai-swfactory-oss/seams-tool-runner`: a shared in-process tool runner.
- `@ai-swfactory-oss/seams-node-runtime`: the Node runtime that assembles the capabilities.
- `@ai-swfactory-oss/seams-retry`: a shared in-process retry helper.
- `@ai-swfactory-oss/seams-lint-kit`: a shared in-process lint kit.
- `@ai-swfactory-oss/seams-archive`: a shared in-process archive helper.

## Licence

MIT
