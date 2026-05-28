import { platform as getPlatform } from 'node:os'
import { info, setFailed, setOutput } from '@actions/core'
import { runLinuxPipeline } from './linux.js'
import { createEnv, validatePlatform } from './platform.js'
import { runWindowsPipeline } from './windows.js'

export const run = async (): Promise<void> => {
  const platformName = validatePlatform(getPlatform())
  const env = createEnv(platformName)

  info(`🖥️  Detected platform: ${platformName}`)

  if (platformName === 'linux') {
    await runLinuxPipeline(env)
  } else {
    await runWindowsPipeline(env)
  }

  setOutput('status', 'success')
  info('OpenCL environment is fully configured.')
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  setFailed(`${message}`)
})
