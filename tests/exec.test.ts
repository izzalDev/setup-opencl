import { describe, expect, it, vi } from 'vitest'
import type { ActionEnv } from '../src/types.js'

vi.mock('@actions/exec', () => ({
  exec: vi.fn().mockResolvedValue(0),
}))

import { exec } from '@actions/exec'
import { runCommand } from '../src/exec.js'

const mockedExec = vi.mocked(exec)

describe('runCommand', () => {
  it('forwards cmd, args, and env to exec', async () => {
    const env: ActionEnv = { PATH: '/usr/bin', HOME: '/home/runner' }
    await runCommand('sudo', ['apt-get', 'update'], env)

    expect(mockedExec).toHaveBeenCalledWith('sudo', ['apt-get', 'update'], {
      env: env as Record<string, string>,
    })
  })

  it('returns the exit code from exec', async () => {
    mockedExec.mockResolvedValueOnce(42)
    const env: ActionEnv = {}

    const result = await runCommand('echo', ['hello'], env)
    expect(result).toBe(42)
  })
})
