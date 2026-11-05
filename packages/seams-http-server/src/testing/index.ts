import type { PackageDescription, SeamsHttpServer } from '../index'

export const createFakeSeamsHttpServer = (description: PackageDescription): SeamsHttpServer => ({
  describe: () => description,
})
