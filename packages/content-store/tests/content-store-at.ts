import type { Files } from '@ai-swfactory-oss/files'

import { type ContentStore, createContentStoreSdk } from '../src/index'

export const contentStoreAt = (root: string, files: Files): ContentStore => {
  const created = createContentStoreSdk({ root }, { files })
  if ('kind' in created) throw new Error(`the root ${created.root} is refused`)
  return created
}
