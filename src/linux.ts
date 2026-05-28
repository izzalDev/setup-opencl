import { restoreCache, saveCache } from '@actions/cache'
import { info } from '@actions/core'
import { runCommand } from './exec.js'
import type { ActionEnv } from './types.js'

export const runLinuxPipeline = async (env: ActionEnv): Promise<void> => {
  const cacheKey = 'intel-oneapi-apt'
  const cacheDir = `${process.cwd()}/apt-cache`
  const cachePath = [cacheDir]
  const hit = await restoreCache(cachePath, cacheKey)

  info('📦 Adding Intel repository GPG key (ASCII format)...')
  await runCommand(
    'sudo',
    [
      'wget',
      '-O',
      '/usr/share/keyrings/oneapi-archive-keyring.asc',
      'https://apt.repos.intel.com/intel-gpg-keys/GPG-PUB-KEY-INTEL-SW-PRODUCTS.PUB',
    ],
    env,
  )

  info('📦 Adding Intel oneAPI repository to apt sources...')
  const repoString =
    'deb [signed-by=/usr/share/keyrings/oneapi-archive-keyring.asc] https://apt.repos.intel.com/oneapi all main'
  await runCommand('bash', ['-c', `echo "${repoString}" | sudo tee /etc/apt/sources.list.d/oneAPI.list`], env)

  info('📦 Updating package index...')
  await runCommand('sudo', ['apt-get', 'update'], env)

  info('🔧 Installing Intel oneAPI Runtime (CPU)...')
  await runCommand('mkdir', ['-p', `${cacheDir}/partial`], env)
  await runCommand(
    'sudo',
    ['apt-get', '-o', `Dir::Cache::Archives=${cacheDir}`, 'install', '-y', 'intel-oneapi-runtime-opencl'],
    env,
  )

  info('🔍 Installing clinfo for verification...')
  await runCommand('sudo', ['apt-get', '-o', `Dir::Cache::Archives=${cacheDir}`, 'install', '-y', 'clinfo'], env)

  if (!hit) await saveCache(cachePath, cacheKey)

  info('✅ Verifying OpenCL installation with clinfo...')
  await runCommand('clinfo', ['-l'], env)
}
