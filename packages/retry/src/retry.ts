import { checkedPolicy } from './domain/policy'
import type { PollPolicy, Retry, RetryPolicy, RetryPorts, Wait } from './types'

export const createRetrySdk = (policy: RetryPolicy | PollPolicy, { clock }: RetryPorts): Retry => {
  checkedPolicy(policy)
  return { waitFor: (step: Wait) => clock.wait(step.wait) }
}
