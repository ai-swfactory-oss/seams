export interface PackageDescription {
  readonly name: string
}

export interface SeamsModule {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-module' }

export const createSeamsModule = (): SeamsModule => ({
  describe: () => description,
})
