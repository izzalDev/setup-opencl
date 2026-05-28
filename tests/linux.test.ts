import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionEnv } from '../src/types.js'

vi.mock('@actions/core', () => ({ info: vi.fn() }))
vi.mock('@actions/cache', () => ({
  restoreCache: vi.fn(),
  saveCache: vi.fn(),
}))
vi.mock('../src/exec.js', () => ({ runCommand: vi.fn().mockResolvedValue(0) }))

import { runCommand } from '../src/exec.js'
import { runLinuxPipeline } from '../src/linux.js'

const mockedRunCommand = vi.mocked(runCommand)
const cacheDir = `${process.cwd()}/apt-cache`

describe('runLinuxPipeline', () => {
  const env: ActionEnv = {
    PATH: '/usr/bin',
    DEBIAN_FRONTEND: 'noninteractive',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds Intel repository GPG key directly in ASCII format', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledWith(
      'sudo',
      [
        'wget',
        '-O',
        '/usr/share/keyrings/oneapi-archive-keyring.asc',
        'https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB',
      ],
      env,
    )
  })

  it('adds Intel oneAPI repository to apt sources', async () => {
    await runLinuxPipeline(env)

    const repoString =
      'deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.asc] https://apt.repos.intel.com/oneapi all main'
    expect(mockedRunCommand).toHaveBeenCalledWith(
      'bash',
      ['-c', `echo "${repoString}" | sudo tee /etc/apt/sources.list.d/oneAPI.list`],
      env,
    )
  })

  it('updates package index', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledWith('sudo', ['apt-get', 'update'], env)
  })

  it('installs intel-oneapi-runtime-opencl', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledWith(
      'sudo',
      ['apt-get', '-o', `Dir::Cache::Archives=${cacheDir}`, 'install', '-y', 'intel-oneapi-runtime-opencl'],
      env,
    )
  })

  it('installs clinfo', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledWith(
      'sudo',
      ['apt-get', '-o', `Dir::Cache::Archives=${cacheDir}`, 'install', '-y', 'clinfo'],
      env,
    )
  })

  it('runs clinfo verification', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledWith('clinfo', ['-l'], env)
  })

  it('executes all commands in correct order', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledTimes(7)

    const calls = mockedRunCommand.mock.calls
    expect(calls[0]?.[1]?.[0]).toBe('wget')
    expect(calls[1]?.[1]?.[1]).toContain('tee')
    expect(calls[2]?.[1]).toEqual(['apt-get', 'update'])
    expect(calls[3]?.[1]).toEqual(['-p', `${cacheDir}/partial`])
    expect(calls[4]?.[1]).toEqual([
      'apt-get',
      '-o',
      `Dir::Cache::Archives=${cacheDir}`,
      'install',
      '-y',
      'intel-oneapi-runtime-opencl',
    ])
    expect(calls[5]?.[1]).toEqual(['apt-get', '-o', `Dir::Cache::Archives=${cacheDir}`, 'install', '-y', 'clinfo'])
    expect(calls[6]?.[1]).toEqual(['-l'])
  })
})
