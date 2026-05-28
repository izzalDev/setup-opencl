import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ActionEnv } from '../src/types.js'

vi.mock('@actions/core', () => ({
  info: vi.fn(),
}))

vi.mock('../src/exec.js', () => ({
  runCommand: vi.fn().mockResolvedValue(0),
}))

import { runCommand } from '../src/exec.js'
import { runLinuxPipeline } from '../src/linux.js'

const mockedRunCommand = vi.mocked(runCommand)

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
      ['apt-get', 'install', '-y', 'intel-oneapi-runtime-opencl'],
      env,
    )
  })

  it('installs clinfo', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledWith('sudo', ['apt-get', 'install', '-y', 'clinfo'], env)
  })

  it('runs clinfo verification', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledWith('clinfo', ['-l'], env)
  })

  it('executes all commands in correct order', async () => {
    await runLinuxPipeline(env)

    expect(mockedRunCommand).toHaveBeenCalledTimes(6)

    const calls = mockedRunCommand.mock.calls

    // 1. Wget GPG Key
    expect(calls[0]?.[0]).toBe('sudo')
    expect(calls[0]?.[1]?.[0]).toBe('wget')

    // 2. Add APT Source
    expect(calls[1]?.[0]).toBe('bash')
    expect(calls[1]?.[1]?.[1]).toContain('tee /etc/apt/sources.list.d/oneAPI.list')

    // 3. Apt Update
    expect(calls[2]?.[0]).toBe('sudo')
    expect(calls[2]?.[1]).toEqual(['apt-get', 'update'])

    // 4. Install OpenCL CPU Runtime
    expect(calls[3]?.[0]).toBe('sudo')
    expect(calls[3]?.[1]).toEqual(['apt-get', 'install', '-y', 'intel-oneapi-runtime-opencl'])

    // 5. Install Clinfo
    expect(calls[4]?.[0]).toBe('sudo')
    expect(calls[4]?.[1]).toEqual(['apt-get', 'install', '-y', 'clinfo'])

    // 6. Verify Clinfo
    expect(calls[5]?.[0]).toBe('clinfo')
    expect(calls[5]?.[1]).toEqual(['-l'])
  })
})
