import type { PackageDescription, SeamsRetry } from '../index'

export const createFakeSeamsRetry = (description: PackageDescription): SeamsRetry => ({
  describe: () => description,
})
