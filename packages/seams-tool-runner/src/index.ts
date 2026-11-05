export interface PackageDescription {
  readonly name: string
}

export interface SeamsToolRunner {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-tool-runner' }

export const createSeamsToolRunner = (): SeamsToolRunner => ({
  describe: () => description,
})
