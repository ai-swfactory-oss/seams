export const escapeGlob = (path: string): string => path.replace(/[\\*?{}[\],]/gu, '\\$&')

const expandBraces = (pattern: string): string[] => {
  let open = -1
  let depth = 0
  const commas: number[] = []
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]
    if (char === '\\') {
      index += 1
      continue
    }
    if (open === -1) {
      if (char === '{') {
        open = index
        depth = 1
      }
      continue
    }
    if (char === '{') depth += 1
    else if (char === ',' && depth === 1) commas.push(index)
    else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        const head = pattern.slice(0, open)
        const tail = pattern.slice(index + 1)
        const bounds = [open, ...commas, index]
        const options = bounds.slice(0, -1).map((start, at) => pattern.slice(start + 1, bounds[at + 1]))
        return options.flatMap(option => expandBraces(`${head}${option}${tail}`))
      }
    }
  }
  return [pattern]
}

const escapeChar = (char: string): string => (/[\\^$.|+()[\]{}*?]/.test(char) ? `\\${char}` : char)

const segmentSource = (segment: string): string => {
  const chars = Array.from(segment)
  let source = ''
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index] ?? ''
    const next = chars[index + 1]
    if (char === '\\' && next !== undefined) {
      source += escapeChar(next)
      index += 1
    } else source += char === '*' ? '[^/]*' : char === '?' ? '[^/]' : escapeChar(char)
  }
  return source
}

const patternSource = (pattern: string): string => {
  const segments = pattern.split('/').filter(segment => segment !== '' && segment !== '.')
  let source = ''
  let needsSeparator = false
  segments.forEach((segment, index) => {
    const last = index === segments.length - 1
    if (segment === '**') {
      if (last) source += needsSeparator ? '(?:/.*)?' : '.*'
      else source += needsSeparator ? '(?:/.*)?/' : '(?:.*/)?'
      needsSeparator = false
    } else {
      source += `${needsSeparator ? '/' : ''}${segmentSource(segment)}`
      needsSeparator = true
    }
  })
  return `^${source}$`
}

export const globMatcher = (pattern: string): ((path: string) => boolean) => {
  const expressions = expandBraces(pattern).map(expanded => new RegExp(patternSource(expanded), 'u'))
  return path => expressions.some(expression => expression.test(path))
}
