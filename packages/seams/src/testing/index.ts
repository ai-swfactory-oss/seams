import type { PackageDescription, Seams } from '../index'

export const createFakeSeams = (description: PackageDescription): Seams => ({
  describe: () => description,
})
