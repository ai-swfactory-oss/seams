import type { PackageDescription, SeamsModule } from '../index'

export const createFakeSeamsModule = (description: PackageDescription): SeamsModule => ({
  describe: () => description,
})
