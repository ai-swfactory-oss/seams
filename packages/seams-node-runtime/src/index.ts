export interface PackageDescription {
  readonly name: string
}

export interface SeamsNodeRuntime {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-node-runtime' }

export const createSeamsNodeRuntime = (): SeamsNodeRuntime => ({
  describe: () => description,
})
