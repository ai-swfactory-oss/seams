import type { Change, ChangeFailure, ChangeOutcome } from '../types'

export const applyInOrder = async (
  changes: readonly Change[],
  step: (change: Change) => Promise<ChangeFailure | undefined>,
): Promise<readonly ChangeOutcome[]> => {
  const outcomes: ChangeOutcome[] = []
  let failed = false
  for (const change of changes) {
    if (failed) {
      outcomes.push({ kind: 'skipped' })
      continue
    }
    const failure = await step(change)
    if (failure === undefined) {
      outcomes.push({ kind: 'applied' })
    } else {
      failed = true
      outcomes.push({ kind: 'failed', reason: failure })
    }
  }
  return outcomes
}
