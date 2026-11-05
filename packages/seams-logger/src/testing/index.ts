import type { PackageDescription, SeamsLogger } from '../index'

export const createFakeSeamsLogger = (description: PackageDescription): SeamsLogger => ({
  describe: () => description,
})
