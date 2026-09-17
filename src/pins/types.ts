import type {StoredConversationId} from '../common/ConversationId.js'

export type {StoredConversationId}

export interface PinnedMessage {
  id: number
  conversationId: StoredConversationId
  messageId: string
  text: string
  sender?: StoredConversationId
  pinnedAt: string
}
