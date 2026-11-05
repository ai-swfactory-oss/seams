export interface PackageDescription {
  readonly name: string
}

export interface SeamsProcess {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-process' }

export const createSeamsProcess = (): SeamsProcess => ({
  describe: () => description,
})
