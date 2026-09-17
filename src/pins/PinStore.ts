import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import type {StoredConversationId} from '../common/ConversationId.js'
import type {PinnedMessage} from './types.js'

interface PinFile {
  nextId: number
  pins: PinnedMessage[]
}

function sameConversation(a: StoredConversationId, b: StoredConversationId): boolean {
  return a.id === b.id && a.domain === b.domain
}

/** JSON-file-backed store for pinned messages. Pin volume is tiny, so a flat file is enough. */
export class PinStore {
  private pins: PinnedMessage[]
  private nextId: number

  constructor(private readonly filePath: string) {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, {recursive: true})
    }

    if (existsSync(filePath)) {
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as PinFile
      this.pins = parsed.pins
      this.nextId = parsed.nextId
    } else {
      this.pins = []
      this.nextId = 1
      this.persist()
    }
  }

  private persist(): void {
    const payload: PinFile = {nextId: this.nextId, pins: this.pins}
    writeFileSync(this.filePath, JSON.stringify(payload, null, 2))
  }

  findByMessageId(conversationId: StoredConversationId, messageId: string): PinnedMessage | undefined {
    return this.pins.find((p) => p.messageId === messageId && sameConversation(p.conversationId, conversationId))
  }

  /** Idempotent: pinning an already-pinned message just returns the existing entry. */
  add(conversationId: StoredConversationId, messageId: string, text: string, sender?: StoredConversationId): PinnedMessage {
    const existing = this.findByMessageId(conversationId, messageId)
    if (existing) {
      return existing
    }
    const pin: PinnedMessage = {
      id: this.nextId++,
      conversationId,
      messageId,
      text,
      sender,
      pinnedAt: new Date().toISOString()
    }
    this.pins.push(pin)
    this.persist()
    return pin
  }

  listForConversation(conversationId: StoredConversationId): PinnedMessage[] {
    return this.pins.filter((p) => sameConversation(p.conversationId, conversationId)).sort((a, b) => a.id - b.id)
  }

  removeById(id: number, conversationId: StoredConversationId): boolean {
    const index = this.pins.findIndex((p) => p.id === id && sameConversation(p.conversationId, conversationId))
    if (index === -1) {
      return false
    }
    this.pins.splice(index, 1)
    this.persist()
    return true
  }

  removeByMessageId(conversationId: StoredConversationId, messageId: string): boolean {
    const index = this.pins.findIndex((p) => p.messageId === messageId && sameConversation(p.conversationId, conversationId))
    if (index === -1) {
      return false
    }
    this.pins.splice(index, 1)
    this.persist()
    return true
  }
}
