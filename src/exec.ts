import { exec } from '@actions/exec'
import type { ActionEnv } from './types.js'

export const runCommand = (cmd: string, args: string[], env: ActionEnv): Promise<number> =>
  exec(cmd, args, { env: env as Record<string, string> })
