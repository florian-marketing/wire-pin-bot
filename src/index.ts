import 'reflect-metadata'
import {type BackendConnectionListener, WireAppSdk} from '@wireapp/wire-apps-js-sdk'
import {CRYPTOGRAPHY_STORAGE_KEY, PINS_FILE, WIRE_API_HOST, WIRE_API_TOKEN} from './config.js'
import {MessageCache} from './pins/MessageCache.js'
import {PinStore} from './pins/PinStore.js'
import {PinHandler} from './PinHandler.js'

const pinStore = new PinStore(PINS_FILE)
const messageCache = new MessageCache()

const sdk = await WireAppSdk.create(
  WIRE_API_TOKEN,
  WIRE_API_HOST,
  CRYPTOGRAPHY_STORAGE_KEY,
  new PinHandler(pinStore, messageCache)
)

const backendConnectionListener: BackendConnectionListener = {
  onConnected: () => console.log('Connected to Wire backend'),
  onDisconnected: () => console.log('Disconnected from Wire backend')
}
sdk.setBackendConnectionListener(backendConnectionListener)

console.log('Pin bot is running. Press Ctrl+C to stop.')
await sdk.startListening()
