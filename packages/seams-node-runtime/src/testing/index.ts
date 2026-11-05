import type { PackageDescription, SeamsNodeRuntime } from '../index'

export const createFakeSeamsNodeRuntime = (description: PackageDescription): SeamsNodeRuntime => ({
  describe: () => description,
})
