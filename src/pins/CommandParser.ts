import {takeTokens} from '../common/tokenize.js'

export type ParsedPinCommand = {type: 'help'} | {type: 'list'} | {type: 'remove'; id: number}

export type PinParseResult = {ok: true; command: ParsedPinCommand} | {ok: false; error: string}

/** Returns null if the text isn't a /pin command at all (so the handler can ignore it silently). */
export function parsePinCommand(rawText: string): PinParseResult | null {
  const text = rawText.trim()
  if (!/^\/pin(\s|$)/i.test(text)) {
    return null
  }

  const afterCommand = text.replace(/^\/pin\s*/i, '')
  const subSplit = takeTokens(afterCommand, 1)
  const sub = subSplit?.tokens[0]?.toLowerCase()

  if (!sub || sub === 'list') {
    return {ok: true, command: {type: 'list'}}
  }

  if (sub === 'help') {
    return {ok: true, command: {type: 'help'}}
  }

  if (sub === 'remove' || sub === 'delete') {
    const idSplit = takeTokens(subSplit!.rest, 1)
    if (!idSplit) {
      return {ok: false, error: 'Usage: /pin remove <id>'}
    }
    const id = Number(idSplit.tokens[0])
    if (!Number.isInteger(id)) {
      return {ok: false, error: `Invalid pin id "${idSplit.tokens[0]}".`}
    }
    return {ok: true, command: {type: 'remove', id}}
  }

  return {ok: false, error: `Unknown command "${sub}". Send "/pin help" for usage.`}
}
