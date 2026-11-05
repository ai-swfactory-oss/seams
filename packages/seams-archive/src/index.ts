export interface PackageDescription {
  readonly name: string
}

export interface SeamsArchive {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-archive' }

export const createSeamsArchive = (): SeamsArchive => ({
  describe: () => description,
})
