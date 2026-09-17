import type {PinnedMessage} from './types.js'

export const PIN_EMOJI = '📌'

export const PIN_USAGE = `**Pin commands:**
- React to any message with ${PIN_EMOJI} to pin it
- \`/pin\` or \`/pin list\` — show pinned messages in this chat
- \`/pin remove <id>\` — unpin #id
- \`/pin help\` — show this message`

export function formatPinList(pins: PinnedMessage[]): string {
  if (pins.length === 0) {
    return `No pinned messages in this chat yet. React to a message with ${PIN_EMOJI} to pin it.`
  }
  const lines = pins.map((p) => `#${p.id} — "${p.text}"`)
  return `**Pinned messages in this chat:**\n${lines.join('\n')}`
}
