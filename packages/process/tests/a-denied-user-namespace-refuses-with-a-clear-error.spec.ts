import { describe, expect, it } from 'vitest'

import { launchRefusal, UserNamespacesUnavailableError } from '../src/index'

describe('a denied user namespace', () => {
  it('refuses with a clear error when the uid_map write is denied', () => {
    const refusal = launchRefusal({ exitCode: 1, stderr: 'unshare: write failed /proc/self/uid_map: Operation not permitted\n' })

    expect([refusal instanceof UserNamespacesUnavailableError, refusal?.message.startsWith('user namespaces unavailable')]).toEqual([
      true,
      true,
    ])
  })

  it('names the kernel denial in the error', () => {
    const refusal = launchRefusal({ exitCode: 1, stderr: 'unshare: write failed /proc/self/uid_map: Operation not permitted\n' })

    expect(refusal?.message).toBe('user namespaces unavailable: unshare: write failed /proc/self/uid_map: Operation not permitted')
  })

  it('refuses the same way when the gid_map or setgroups write is denied', () => {
    const refusals = [
      launchRefusal({ exitCode: 1, stderr: 'unshare: write failed /proc/self/gid_map: Operation not permitted\n' }),
      launchRefusal({ exitCode: 1, stderr: 'unshare: cannot open /proc/self/setgroups: Permission denied\n' }),
    ]

    expect(refusals.map(refusal => refusal instanceof UserNamespacesUnavailableError)).toEqual([true, true])
  })

  it('does not take any other launch failure for a denied user namespace', () => {
    const others = [
      launchRefusal({ exitCode: 0, stderr: '' }),
      launchRefusal({ exitCode: 1, stderr: 'unshare: failed to execute /opt/bin/tool: No such file or directory\n' }),
      launchRefusal({ exitCode: 1, stderr: 'tool: write failed /proc/self/uid_map: Operation not permitted\n' }),
      launchRefusal({ exitCode: 2, stderr: 'usage: tool [file]\n' }),
    ]

    expect(others).toEqual([undefined, undefined, undefined, undefined])
  })
})
