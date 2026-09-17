# wire-pin-bot

A Wire App built on `@wireapp/wire-apps-js-sdk`. Add it to any conversation and
anyone in that chat can pin a message by reacting to it with 📌.

This is one of two independent apps — see also
[wire-reminder-bot](https://github.com/florian-marketing/wire-reminder-bot),
which sends scheduled reminders. They're separate Wire App registrations
(separate tokens) and separate running processes; a team can install either
or both.

## 1. Prerequisites (do this before the code will run)

An "App" here is a Wire API client, not a regular user — it needs to be registered
by a team admin:

- A Wire team on a **paid plan**
- **MLS** set as the default protocol for the team
- The **Apps** feature flag enabled for the team
- **Team owner or admin** access

If any of those aren't in place yet, that has to be sorted with whoever manages
the Wire team/tenant before you can get credentials.

## 2. Register the app and get credentials

1. In Wire, go to Settings → Manage team (or teams.wire.com)
2. Open the **Integrations** tab → **Create App**
3. Fill in the app details and save (give it a distinct name from the reminder
   app, e.g. "Pin Bot", since they're separate registrations)
4. Copy the **auth token** immediately — it's shown once and can't be retrieved again
5. Note the **App ID**, **host**, and **domain** shown after creation

## 3. Configure

```bash
cp .env.example .env
npm run gen-key   # generates a random 32-byte hex key, paste into WIRE_SDK_STORAGE_KEY
```

Fill in `.env`:

```
WIRE_SDK_API_TOKEN=<the auth token from step 2>
WIRE_SDK_API_HOST=<the host from step 2>
WIRE_SDK_STORAGE_KEY=<output of npm run gen-key>
PINS_FILE=./data/pins.json   # optional, this is the default
```

`WIRE_SDK_STORAGE_KEY` encrypts the local key material store (`./storage`,
SQLite + crypto keys) — keep it secret, never reuse it across apps (including
the reminder app), never commit it.

## 4. Run

```bash
npm install
npm run dev      # runs directly with tsx
# or
npm run build && npm start
```

As a team admin, add the app to a conversation — it posts a greeting with the
command list. From then on, anyone in that chat can pin/unpin messages there.

## 5. Keep it running (macOS, via launchd)

Once `.env` has real credentials, run it as a background service that survives
crashes and reboots instead of a foreground `npm run dev`:

```bash
npm run build
cp deploy/com.florianfrese.wire-pin-bot.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.florianfrese.wire-pin-bot.plist
```

Logs land in `~/Library/Logs/wire-pin-bot/`. Useful commands:

```bash
launchctl unload ~/Library/LaunchAgents/com.florianfrese.wire-pin-bot.plist   # stop
launchctl load ~/Library/LaunchAgents/com.florianfrese.wire-pin-bot.plist     # start
tail -f ~/Library/Logs/wire-pin-bot/out.log                                  # watch logs
```

After changing code, re-run `npm run build` then unload/load to pick it up.

Caveats of running this on a personal Mac rather than a server: it only stays
connected while the machine is powered on, awake, and you're logged in — if
the laptop sleeps (e.g. lid closed), the connection drops until it wakes.
Disable sleep (System Settings → Lock Screen / Battery) if you need this to
be reliably always-on, or move it to a real server/VM later.

If you're also running wire-reminder-bot on the same Mac, both launchd
services run independently side by side — no conflict, since they're
separate processes with separate `WorkingDirectory`/log paths.

## Commands

```
/pin                    same as /pin list
/pin list               show pinned messages in this chat
/pin remove <id>        unpin #id
/pin help               show usage
```

Pinning: react to any message with 📌 to pin it. Removing your 📌 reaction
unpins it.

Known limitations:
- Only messages sent while the bot process has been running can be pinned —
  it looks up the message text from a short-lived in-memory cache, not from
  Wire's history, so a restart clears what's pinnable (already-pinned
  messages stay pinned; only the "react to pin" lookup is affected).
- Pinned/unpinned is a single state per message, not tracked per user — if
  two people pin the same message and one of them removes their own
  reaction, it unpins for everyone.

## Where the logic lives

- [src/config.ts](src/config.ts) — loads and validates env vars
- [src/common/tokenize.ts](src/common/tokenize.ts) — command-text tokenizer
- [src/common/ConversationId.ts](src/common/ConversationId.ts) — conversation id shape
- [src/pins/](src/pins/) — pin command parsing, storage, and the recent-message cache
- [src/PinHandler.ts](src/PinHandler.ts) — the `WireEventsHandler` subclass wiring commands/reactions to replies
- [src/index.ts](src/index.ts) — wires up the SDK, store, and cache, and starts listening

## Docs

- https://dev.wire.com/ — main developer docs
- https://github.com/wireapp/wire-apps-js-sdk — SDK source and more examples
  (`sample/src/examples/callbacks`) for reactions, pings, location messages,
  asset downloads, etc.
