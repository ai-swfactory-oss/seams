export interface PackageDescription {
  readonly name: string
}

export interface SeamsHost {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-host' }

export const createSeamsHost = (): SeamsHost => ({
  describe: () => description,
})
