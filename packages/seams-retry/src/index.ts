export interface PackageDescription {
  readonly name: string
}

export interface SeamsRetry {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-retry' }

export const createSeamsRetry = (): SeamsRetry => ({
  describe: () => description,
})
