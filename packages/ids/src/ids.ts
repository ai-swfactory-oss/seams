import { formatUuidV4 } from './domain/uuid'
import type { Ids, IdsData, IdsPorts } from './types'

const UUID_BYTES = 16

export const createIdsSdk = (_data: IdsData, { random }: IdsPorts): Ids => ({
  uuid: () => formatUuidV4(random.bytes(UUID_BYTES)),
})
