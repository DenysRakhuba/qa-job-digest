# qa-job-digest

[![CI](https://github.com/DenysRakhuba/qa-job-digest/actions/workflows/ci.yml/badge.svg)](https://github.com/DenysRakhuba/qa-job-digest/actions/workflows/ci.yml)

A Telegram bot that sends a daily top 10 of QA Automation / SDET vacancies from
DOU and Djinni, scored against a personal job profile.

Every vacancy comes with a score, the three strongest reasons it fits, warnings,
a link and two buttons: "applied" and "not a fit". A vacancy with a decision never
comes back; one without a decision is repeated every few days while it is still
in the feed. The bot only reads public RSS feeds and messages its owner: it never
applies or posts anywhere.

## How it works

```
RSS feeds ──▶ collect ──▶ rank ──▶ Telegram ◀── button clicks
 DOU, Djinni   parse,      filter,    top 10 on          │
               clean       score      weekdays           │
                              │                          │
                       data/state.json ◀──── sync ───────┘
                       (shown, decided)
```

1. **Collect** — fetch the feeds, turn HTML into plain text, strip tracking
   parameters from links.
2. **Rank** — drop what never fits (Senior, lead, trainee, manual-only,
   crypto/Web3, army/defense, office-only, salary below $2500, another working
   language), then score the rest from 0 to 100: Playwright + TypeScript, API
   testing, CI/CD, remote work and a known salary add points.
3. **Send** — one message per vacancy with its own buttons: the top 10 new ones,
   then up to 5 reminders about vacancies still waiting for a decision.
4. **Sync** — read button clicks from Telegram, store the decisions and replace
   the buttons with the chosen one (it can be undone).

The state lives in `data/state.json`, committed back by the workflows. Links are
stored as a keyed hash (`STATE_KEY`): the repository is public, the list of
applications is not.

GitHub's built-in `schedule` ran the digest hours late, so both workflows are
started through the API by an external cron service: the digest on weekday
mornings, the sync every hour.

## Why rules, not an LLM

Rules are free, fast and predictable: every score can be explained and every
filter has a unit test. Deeper analysis of a single vacancy is done by hand
with an AI assistant, for the few that make it into the digest.

## Project structure

```
src/
  main.ts        digest: sync → collect → rank → send
  sync.ts        reads button clicks only
  collect/       RSS feeds, parsing, text cleanup
  rank/          profile patterns, salary parsing, scoring, top 10
  state.ts       shown vacancies and decisions
  decisions.ts   button clicks → decisions
  telegram/      Bot API calls, message formatting
scripts/
  chat-id.ts     one-off helper to find your Telegram chat ID
tests/           mirrors src/
.github/workflows/
  ci.yml         typecheck, lint and tests on every push
  digest.yml     the digest, started on weekday mornings
  decisions.yml  the sync, started every hour
```

## Run locally

Requires Node.js 22 (see `.nvmrc`).

```bash
npm ci
npm run preview   # print the digest, do not touch state.json
npm run check     # typecheck + lint + tests
npm run fix       # autofix lint issues and format
```

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and put the token
   into `.env` as `TELEGRAM_BOT_TOKEN=...`.
2. Send any message to the bot, run `npm run chat-id` and add the printed
   `TELEGRAM_CHAT_ID=...` to `.env`.
3. Generate the key for vacancy ids:
   `printf '\nSTATE_KEY=%s\n' "$(openssl rand -hex 32)" >> .env`.
4. Add all values as repository secrets: `gh secret set -f .env`.
5. Create a fine-grained token with "Actions: read and write" on this repository
   and two jobs in a cron service (e.g. [cron-job.org](https://cron-job.org)),
   each sending `POST https://api.github.com/repos/<owner>/<repo>/actions/workflows/<file>/dispatches`
   with `{"ref":"main"}`: `digest.yml` on weekday mornings, `decisions.yml`
   every hour.

## Tech stack

TypeScript run directly by Node.js 22 (type stripping, no build step) ·
`node:test` · fast-xml-parser · ESLint + typescript-eslint · Prettier ·
GitHub Actions · Telegram Bot API
