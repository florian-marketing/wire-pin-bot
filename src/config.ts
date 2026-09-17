import dotenv from 'dotenv'

dotenv.config()

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be set in .env (see .env.example)`)
  }
  return value
}

export const WIRE_API_TOKEN: string = requireEnv('WIRE_SDK_API_TOKEN')
export const WIRE_API_HOST: string = requireEnv('WIRE_SDK_API_HOST')

// 32-byte key used to encrypt the local cryptographic material store.
// Generate one with: npm run gen-key
// and put it in .env as WIRE_SDK_STORAGE_KEY. Never commit this value or reuse it across apps.
const storageKeyHex = requireEnv('WIRE_SDK_STORAGE_KEY')
export const CRYPTOGRAPHY_STORAGE_KEY: Uint8Array = Uint8Array.from(Buffer.from(storageKeyHex, 'hex'))

if (CRYPTOGRAPHY_STORAGE_KEY.length !== 32) {
  throw new Error('WIRE_SDK_STORAGE_KEY must decode to exactly 32 bytes of hex')
}

export const PINS_FILE: string = process.env['PINS_FILE'] ?? './data/pins.json'
