import type { PackageDescription, SeamsToolRunner } from '../index'

export const createFakeSeamsToolRunner = (description: PackageDescription): SeamsToolRunner => ({
  describe: () => description,
})
