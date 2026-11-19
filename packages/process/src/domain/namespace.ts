export class UserNamespacesUnavailableError extends Error {
  constructor(readonly detail: string) {
    super(`user namespaces unavailable: ${detail}`)
    this.name = 'UserNamespacesUnavailableError'
  }
}

export interface Launch {
  readonly exitCode: number
  readonly stderr: string
}

const DENIED_MAP_WRITE = /^unshare: .*\/proc\/self\/(?:uid_map|gid_map|setgroups)\b/u
const DENIED_CREATION = /^unshare: unshare failed: (?:Operation not permitted|No space left on device)$/u

export const launchRefusal = (launch: Launch): UserNamespacesUnavailableError | undefined => {
  if (launch.exitCode === 0) return undefined
  const [first = ''] = launch.stderr.split('\n', 1)
  return DENIED_MAP_WRITE.test(first) || DENIED_CREATION.test(first) ? new UserNamespacesUnavailableError(first) : undefined
}
