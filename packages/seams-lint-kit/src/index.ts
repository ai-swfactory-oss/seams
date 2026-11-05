export interface PackageDescription {
  readonly name: string
}

export interface SeamsLintKit {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-lint-kit' }

export const createSeamsLintKit = (): SeamsLintKit => ({
  describe: () => description,
})
