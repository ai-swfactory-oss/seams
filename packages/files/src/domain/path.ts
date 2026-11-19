export const normalisePath = (path: string): string | undefined => {
  if (path.startsWith('/') || path.includes('\0')) return undefined
  const segments: string[] = []
  for (const segment of path.split('/')) {
    if (segment === '..') return undefined
    if (segment !== '' && segment !== '.') segments.push(segment)
  }
  return segments.join('/')
}

export const isWithin = (path: string, directory: string): boolean =>
  directory === '' || path === directory || path.startsWith(`${directory}/`)

export const relativeTo = (path: string, directory: string): string => (directory === '' ? path : path.slice(directory.length + 1))

export const joinPath = (directory: string, name: string): string => (directory === '' ? name : `${directory}/${name}`)

export const parentsOf = (path: string): string[] => {
  const segments = path.split('/')
  return segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('/'))
}

export const comparePaths = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)
