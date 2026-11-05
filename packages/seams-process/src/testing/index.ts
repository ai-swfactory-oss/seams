import type { PackageDescription, SeamsProcess } from '../index'

export const createFakeSeamsProcess = (description: PackageDescription): SeamsProcess => ({
  describe: () => description,
})
