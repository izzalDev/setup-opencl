import { describe, expect, it, vi } from 'vitest'

vi.mock('@actions/core', () => ({
  info: vi.fn(),
  setFailed: vi.fn(),
  setOutput: vi.fn(),
}))

vi.mock('os', () => ({
  platform: vi.fn().mockReturnValue('linux'),
}))

vi.mock('../src/platform.js', () => ({
  validatePlatform: vi.fn().mockReturnValue('linux'),
  createEnv: vi.fn().mockReturnValue({ PATH: '/usr/bin' }),
}))

vi.mock('../src/linux.js', () => ({
  runLinuxPipeline: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/windows.js', () => ({
  runWindowsPipeline: vi.fn().mockResolvedValue(undefined),
}))

import { setFailed, setOutput } from '@actions/core'
import { run } from '../src/index.js'
import { runLinuxPipeline } from '../src/linux.js'
import { validatePlatform } from '../src/platform.js'
import { runWindowsPipeline } from '../src/windows.js'

const mockedValidatePlatform = vi.mocked(validatePlatform)
const mockedRunLinux = vi.mocked(runLinuxPipeline)
const mockedRunWindows = vi.mocked(runWindowsPipeline)
const mockedSetOutput = vi.mocked(setOutput)
const mockedSetFailed = vi.mocked(setFailed)

describe('run', () => {
  it('runs Linux pipeline when platform is linux', async () => {
    mockedValidatePlatform.mockReturnValue('linux')

    await run()

    expect(mockedRunLinux).toHaveBeenCalled()
    expect(mockedRunWindows).not.toHaveBeenCalled()
  })

  it('runs Windows pipeline when platform is win32', async () => {
    mockedValidatePlatform.mockReturnValue('win32')

    await run()

    expect(mockedRunWindows).toHaveBeenCalled()
    expect(mockedRunLinux).not.toHaveBeenCalled()
  })

  it('sets output status to "success"', async () => {
    await run()

    expect(mockedSetOutput).toHaveBeenCalledWith('status', 'success')
  })

  it('does not call setFailed on success', async () => {
    await run()

    expect(mockedSetFailed).not.toHaveBeenCalled()
  })
})
