export interface TakenLine {
  readonly line: string | undefined
  readonly rest: string
}

const withoutCarriageReturn = (line: string): string => (line.endsWith('\r') ? line.slice(0, -1) : line)

export const takeLine = (input: string): TakenLine => {
  if (input === '') return { line: undefined, rest: '' }
  const end = input.indexOf('\n')
  if (end === -1) return { line: withoutCarriageReturn(input), rest: '' }
  return { line: withoutCarriageReturn(input.slice(0, end)), rest: input.slice(end + 1) }
}
