import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEnv, validatePlatform } from '../src/platform.js'

describe('validatePlatform', () => {
  it('returns "linux" for linux platform', () => {
    expect(validatePlatform('linux')).toBe('linux')
  })

  it('returns "win32" for win32 platform', () => {
    expect(validatePlatform('win32')).toBe('win32')
  })

  it('throws for unsupported platform darwin', () => {
    expect(() => validatePlatform('darwin')).toThrow('Unsupported runner OS')
  })

  it('throws for empty string', () => {
    expect(() => validatePlatform('')).toThrow('Unsupported runner OS')
  })
})

describe('createEnv', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    delete process.env['DEBIAN_FRONTEND']
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('sets DEBIAN_FRONTEND=noninteractive for linux', () => {
    const env = createEnv('linux')
    expect(env['DEBIAN_FRONTEND']).toBe('noninteractive')
  })

  it('includes process.env variables for linux', () => {
    const env = createEnv('linux')
    expect(env['PATH']).toBe(process.env['PATH'])
  })

  it('does not set DEBIAN_FRONTEND for win32', () => {
    const env = createEnv('win32')
    expect(env['DEBIAN_FRONTEND']).toBeUndefined()
  })

  it('includes process.env variables for win32', () => {
    const env = createEnv('win32')
    expect(env['PATH']).toBe(process.env['PATH'])
  })
})
