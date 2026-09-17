import {
  type Conversation,
  type ConversationMember,
  QualifiedId,
  type Reaction,
  TextMessage,
  WireEventsHandler
} from '@wireapp/wire-apps-js-sdk'
import {parsePinCommand} from './pins/CommandParser.js'
import {formatPinList, PIN_EMOJI, PIN_USAGE} from './pins/format.js'
import type {MessageCache} from './pins/MessageCache.js'
import type {PinStore} from './pins/PinStore.js'

/** Handles the /pin command family and 📌 reactions for every conversation the app is in. */
export class PinHandler extends WireEventsHandler {
  constructor(
    private readonly pins: PinStore,
    private readonly messageCache: MessageCache
  ) {
    super()
  }

  public override async onAppAddedToConversation(
    conversation: Conversation,
    _members: ConversationMember[]
  ): Promise<void> {
    const conversationId = new QualifiedId(conversation.id, conversation.domain)
    await this.manager.sendMessage(
      TextMessage.create({
        conversationId,
        text: `Hi! I can pin messages in this chat.\n\n${PIN_USAGE}`
      })
    )
  }

  public override async onTextMessageReceived(wireMessage: TextMessage): Promise<void> {
    this.messageCache.remember({
      id: wireMessage.id,
      conversationId: wireMessage.conversationId,
      text: wireMessage.text,
      sender: wireMessage.sender
    })

    const result = parsePinCommand(wireMessage.text)
    if (!result) {
      return
    }

    if (!result.ok) {
      await this.replyTo(wireMessage, `⚠️ ${result.error}`)
      return
    }

    const conversationId = wireMessage.conversationId
    const command = result.command

    switch (command.type) {
      case 'help':
        await this.replyTo(wireMessage, PIN_USAGE)
        return

      case 'list': {
        const pins = this.pins.listForConversation(conversationId)
        await this.replyTo(wireMessage, formatPinList(pins))
        return
      }

      case 'remove': {
        const removed = this.pins.removeById(command.id, conversationId)
        await this.replyTo(
          wireMessage,
          removed ? `🗑️ Unpinned #${command.id}.` : `⚠️ No pinned message #${command.id} in this chat.`
        )
        return
      }
    }
  }

  public override async onMessageReactionReceived(reaction: Reaction): Promise<void> {
    const conversationId = reaction.conversationId

    if (reaction.emojiSet.has(PIN_EMOJI)) {
      const cached = this.messageCache.get(reaction.messageId)
      if (!cached) {
        await this.manager.sendMessage(
          TextMessage.create({
            conversationId,
            text: `⚠️ Couldn't pin that message — it's too old or was sent before I last restarted.`
          })
        )
        return
      }
      const pin = this.pins.add(conversationId, reaction.messageId, cached.text, cached.sender)
      await this.manager.sendMessage(TextMessage.create({conversationId, text: `📌 Pinned #${pin.id}: "${pin.text}"`}))
      return
    }

    // Emoji set no longer includes the pin emoji: treat as an unpin. This is a single global
    // pinned/unpinned state per message, not a per-user tally — if two people pin the same
    // message and one of them removes their reaction, it unpins for everyone.
    const removed = this.pins.removeByMessageId(conversationId, reaction.messageId)
    if (removed) {
      await this.manager.sendMessage(TextMessage.create({conversationId, text: `📌 Unpinned.`}))
    }
  }

  private async replyTo(original: TextMessage, text: string): Promise<void> {
    await this.manager.sendMessage(TextMessage.createReply({originalMessage: original, text}))
  }
}
