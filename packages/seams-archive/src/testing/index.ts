import type { PackageDescription, SeamsArchive } from '../index'

export const createFakeSeamsArchive = (description: PackageDescription): SeamsArchive => ({
  describe: () => description,
})
