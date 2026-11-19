export type HostOs = 'darwin' | 'linux' | 'win32' | 'freebsd' | 'openbsd' | 'netbsd' | 'sunos' | 'aix' | 'android'

export type HostArch = 'arm64' | 'x64' | 'arm' | 'ia32' | 'loong64' | 'ppc64' | 'riscv64' | 's390x'

export interface HostTty {
  readonly stdin: boolean
  readonly stdout: boolean
  readonly stderr: boolean
  readonly columns: number | undefined
}

export interface HostFacts {
  readonly env: Readonly<Record<string, string>>
  readonly os: HostOs
  readonly arch: HostArch

  readonly home: string
  readonly tty: HostTty

  readonly timeZone: string

  readonly locale: string
}
