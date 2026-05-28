import { tmpdir } from 'node:os'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ActionEnv } from '../src/types.js'

beforeAll(() => {
  process.env['RUNNER_TEMP'] = tmpdir()
})

afterAll(() => {
  delete process.env['RUNNER_TEMP']
})

vi.mock('@actions/core', () => ({
  info: vi.fn(),
}))

vi.mock('@actions/tool-cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@actions/tool-cache')>()
  let cachedPath: string | null = null
  return {
    ...actual,
    downloadTool: vi.fn().mockImplementation(async (url: string) => {
      if (cachedPath) return cachedPath
      cachedPath = await actual.downloadTool(url)
      return cachedPath
    }),
  }
})

vi.mock('fs/promises', () => ({
  readdir: vi.fn().mockResolvedValue(['runtime.msi', 'readme.txt']),
}))

vi.mock('../src/exec.js', () => ({
  runCommand: vi.fn().mockResolvedValue(0),
}))

import { readdir } from 'node:fs/promises'
import { runCommand } from '../src/exec.js'
import { runWindowsPipeline } from '../src/windows.js'

const mockedReaddir = vi.mocked(readdir)
const mockedRunCommand = vi.mocked(runCommand)

describe('runWindowsPipeline', () => {
  const env: ActionEnv = { PATH: 'C:\\Windows' }

  it('downloads the installer successfully', async () => {
    await runWindowsPipeline(env)
    expect(mockedRunCommand).toHaveBeenCalled()
  }, 60_000)

  it('extracts MSI from the downloaded installer', async () => {
    await runWindowsPipeline(env)
    const extractCall = mockedRunCommand.mock.calls[0]
    expect(extractCall?.[1]).toEqual(expect.arrayContaining(['--x', '--s', '--f']))
  }, 60_000)

  it('installs the MSI package with msiexec', async () => {
    await runWindowsPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledWith(
      'msiexec',
      expect.arrayContaining(['/i', expect.stringContaining('runtime.msi'), '/qn']),
      env,
    )
  }, 60_000)

  it('throws if no MSI file is found', async () => {
    mockedReaddir.mockResolvedValueOnce(['readme.txt', 'notes.txt'] as unknown as Awaited<ReturnType<typeof readdir>>)

    await expect(runWindowsPipeline(env)).rejects.toThrow('No MSI package found')
  }, 60_000)

  it('executes extract and install in order', async () => {
    await runWindowsPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledTimes(2)

    const calls = mockedRunCommand.mock.calls
    expect(calls[0]?.[1]).toEqual(expect.arrayContaining(['--x', '--s', '--f']))
    expect(calls[1]?.[0]).toBe('msiexec')
  }, 60_000)
})
