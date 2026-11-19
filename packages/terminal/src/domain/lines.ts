export interface TakenLine {
  readonly line: string | undefined
  readonly rest: string
}

export const takeLine = (input: string): TakenLine => {
  if (input === '') return { line: undefined, rest: '' }
  const end = input.indexOf('\n')
  if (end === -1) return { line: input, rest: '' }
  const line = input.slice(0, end)
  return { line: line.endsWith('\r') ? line.slice(0, -1) : line, rest: input.slice(end + 1) }
}
