export interface TokenSplit {
  tokens: string[]
  rest: string
}

/** Pulls `count` whitespace-separated tokens off the front of `input`, preserving the exact remainder. */
export function takeTokens(input: string, count: number): TokenSplit | null {
  let remaining = input
  const tokens: string[] = []
  for (let i = 0; i < count; i++) {
    const match = remaining.match(/^\s*(\S+)/)
    if (!match) {
      return null
    }
    tokens.push(match[1]!)
    remaining = remaining.slice(match[0].length)
  }
  return {tokens, rest: remaining.trimStart()}
}
