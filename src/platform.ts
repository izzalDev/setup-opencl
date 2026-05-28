import type { ActionEnv, SupportedPlatform } from './types.js'

export const validatePlatform = (platformName: string): SupportedPlatform => {
  if (platformName === 'linux' || platformName === 'win32') {
    return platformName
  }
  throw new Error('❌ Unsupported runner OS. This action only supports Ubuntu and Windows.')
}

export const createEnv = (platformName: SupportedPlatform): ActionEnv => {
  const env: ActionEnv = { ...process.env }

  if (platformName === 'linux') {
    env['DEBIAN_FRONTEND'] = 'noninteractive'
  }

  return env
}
