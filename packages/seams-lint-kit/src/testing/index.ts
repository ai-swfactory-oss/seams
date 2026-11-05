import type { PackageDescription, SeamsLintKit } from '../index'

export const createFakeSeamsLintKit = (description: PackageDescription): SeamsLintKit => ({
  describe: () => description,
})
