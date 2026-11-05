import type { PackageDescription, SeamsHost } from '../index'

export const createFakeSeamsHost = (description: PackageDescription): SeamsHost => ({
  describe: () => description,
})
