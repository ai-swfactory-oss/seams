export interface PackageDescription {
  readonly name: string
}

export interface SeamsLogger {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-logger' }

export const createSeamsLogger = (): SeamsLogger => ({
  describe: () => description,
})
