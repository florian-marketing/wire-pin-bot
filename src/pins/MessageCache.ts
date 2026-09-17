import type {StoredConversationId} from '../common/ConversationId.js'

export interface CachedMessage {
  id: string
  conversationId: StoredConversationId
  text: string
  sender?: StoredConversationId
}

/**
 * Bounded in-memory cache of recently seen text messages, so a 📌 reaction can look up what it's
 * pinning. Not persisted: a message sent before this process last started can't be pinned.
 */
export class MessageCache {
  private readonly messages = new Map<string, CachedMessage>()

  constructor(private readonly maxSize = 2000) {}

  remember(message: CachedMessage): void {
    this.messages.set(message.id, message)
    if (this.messages.size > this.maxSize) {
      const oldestKey = this.messages.keys().next().value
      if (oldestKey !== undefined) {
        this.messages.delete(oldestKey)
      }
    }
  }

  get(messageId: string): CachedMessage | undefined {
    return this.messages.get(messageId)
  }
}
