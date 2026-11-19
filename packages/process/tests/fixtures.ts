import type { Invocation, ProcessEntryJson } from '../src/index'

export const text = (value: string): Uint8Array => new TextEncoder().encode(value)

export const LINT: Invocation = {
  program: { package: '@ai-swfactory-oss/yamllint', version: '1.37.1' },
  location: '/opt/bundles/yamllint/bin/yamllint',
  args: ['-f', 'parsable', 'a.yaml'],
  cwd: '',
  env: { HOME: '/nonexistent', LANG: 'C.UTF-8' },
  input: { entries: [{ path: 'a.yaml', kind: 'file', content: text('a: 1\n'), executable: false }] },
}

export const LINT_ENTRY: ProcessEntryJson = {
  invocation: {
    program: { package: '@ai-swfactory-oss/yamllint', version: '1.37.1' },
    args: ['-f', 'parsable', 'a.yaml'],
    cwd: '',
    env: { LANG: 'C.UTF-8', HOME: '/nonexistent' },
    input: { entries: [{ path: 'a.yaml', kind: 'file', content: 'YTogMQo=', executable: false }] },
  },
  execution: { kind: 'exited', exitCode: 0, stdout: '', stderr: '', changes: [] },
}
