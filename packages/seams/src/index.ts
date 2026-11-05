export interface PackageDescription {
  readonly name: string
}

export interface Seams {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams' }

export const createSeams = (): Seams => ({
  describe: () => description,
})
