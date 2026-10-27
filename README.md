# qa-job-digest

[![CI](https://github.com/DenysRakhuba/qa-job-digest/actions/workflows/ci.yml/badge.svg)](https://github.com/DenysRakhuba/qa-job-digest/actions/workflows/ci.yml)

A Telegram bot that sends a daily top 10 of QA Automation / SDET vacancies from
DOU and Djinni, scored against a personal job profile.

Every vacancy comes with a score, the three strongest reasons it fits, warnings
and a link. Vacancies are shown once. The bot only reads public RSS feeds and
messages its owner: it never applies or posts anywhere.

## How it works

```
RSS feeds ──▶ collect ──▶ rank ──▶ Telegram
 DOU, Djinni   parse,      filter,    top 10 at
               clean       score      10:00 Helsinki
                              │
                       data/seen.json (no repeats)
```

1. **Collect** — fetch the feeds, turn HTML into plain text, strip tracking
   parameters from links.
2. **Rank** — drop what never fits (Senior, lead, trainee, manual-only,
   crypto/Web3, army/defense, office-only, salary below $2500, another working
   language), then score the rest from 0 to 100: Playwright + TypeScript, API
   testing, CI/CD, remote work and a known salary add points.
3. **Send** — format the top 10 for Telegram, split long digests into several
   messages, then record shown links in `data/seen.json`.

A GitHub Actions workflow runs it every morning and commits `seen.json` back to
the repository.

## Why rules, not an LLM

Rules are free, fast and predictable: every score can be explained and every
filter has a unit test. Deeper analysis of a single vacancy is done by hand
with an AI assistant, for the few that make it into the digest.

## Project structure

```
src/
  main.ts        entry point: collect → rank → send
  collect/       RSS feeds, parsing, text cleanup
  rank/          profile patterns, salary parsing, scoring, top 10
  seen.ts        already shown vacancies
  telegram.ts    message formatting and sending
scripts/
  chat-id.ts     one-off helper to find your Telegram chat ID
tests/           mirrors src/
.github/workflows/
  ci.yml         typecheck, lint and tests on every push
  digest.yml     daily digest at 10:00 Europe/Helsinki
```

## Run locally

Requires Node.js 22 (see `.nvmrc`).

```bash
npm ci
npm run preview   # print the digest, do not touch seen.json
npm run check     # typecheck + lint + tests
npm run fix       # autofix lint issues and format
```

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and put the token
   into `.env` as `TELEGRAM_BOT_TOKEN=...`.
2. Send any message to the bot, run `npm run chat-id` and add the printed
   `TELEGRAM_CHAT_ID=...` to `.env`.
3. Add both values as repository secrets: `gh secret set -f .env`.
4. Start the first run by hand: `gh workflow run digest.yml`.

## Tech stack

TypeScript run directly by Node.js 22 (type stripping, no build step) ·
`node:test` · fast-xml-parser · ESLint + typescript-eslint · Prettier ·
GitHub Actions · Telegram Bot API
