import { readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { info } from '@actions/core'
import { downloadTool } from '@actions/tool-cache'
import { runCommand } from './exec.js'
import type { ActionEnv } from './types.js'

const INSTALLER_URL =
  'https://registrationcenter-download.intel.com/akdlm/IRC_NAS/ad824c04-01c8-4ae5-b5e8-164a04f67609/w_opencl_runtime_p_2025.3.1.762.exe'

const downloadInstaller = async (): Promise<string> => {
  info('⬇️  Downloading Intel OpenCL runtime installer...')

  const tempDir = process.env['RUNNER_TEMP'] ?? tmpdir()
  const destPath = path.join(tempDir, 'w_opencl_runtime.exe')

  return downloadTool(INSTALLER_URL, destPath)
}

const extractMsi = async (exePath: string, env: ActionEnv): Promise<string> => {
  info('📂 Extracting MSI files from installer...')

  const tempDir = process.env['RUNNER_TEMP'] ?? tmpdir()
  const outputFolder = path.join(tempDir, 'opencl_extracted')

  await runCommand(exePath, ['--x', '--s', '--f', outputFolder], env)

  info(`✅ Extracted successfully to: ${outputFolder}`)
  return outputFolder
}

const installMsi = async (extractedFolder: string, env: ActionEnv): Promise<void> => {
  info('🔎 Scanning for MSI package...')

  const files = await readdir(extractedFolder)
  const msiFile = files.find((f) => f.endsWith('.msi'))

  if (!msiFile) {
    throw new Error(`❌ No MSI package found in: ${extractedFolder}`)
  }

  const msiPath = path.join(extractedFolder, msiFile)
  const logPath = path.join(extractedFolder, 'msi_install.log')

  info(`🚀 Running silent MSI installation: ${msiFile}`)
  await runCommand('msiexec', ['/i', msiPath, '/qn', '/norestart', '/l*v', logPath], env)

  info('✅ OpenCL runtime installed successfully.')
}

export const runWindowsPipeline = async (env: ActionEnv): Promise<void> => {
  const exePath = await downloadInstaller()
  const extractedFolder = await extractMsi(exePath, env)
  await installMsi(extractedFolder, env)
}
