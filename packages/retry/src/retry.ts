import { checkedPolicy } from './domain/policy'
import type { PollPolicy, Retry, RetryPolicy, RetryPorts, Wait } from './types'

export const createRetry = (policy: RetryPolicy | PollPolicy, ports: RetryPorts): Retry => {
  checkedPolicy(policy)
  return { waitFor: (step: Wait) => ports.clock.wait(step.wait) }
}
