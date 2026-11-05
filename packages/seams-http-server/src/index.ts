export interface PackageDescription {
  readonly name: string
}

export interface SeamsHttpServer {
  readonly describe: () => PackageDescription
}

const description: PackageDescription = { name: '@ai-swfactory-oss/seams-http-server' }

export const createSeamsHttpServer = (): SeamsHttpServer => ({
  describe: () => description,
})
