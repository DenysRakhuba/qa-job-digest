import { fetchAll } from "./collect/feeds.ts";
import { syncDecisions } from "./decisions.ts";
import { buildDigest } from "./rank/digest.ts";
import {
  loadState,
  markShown,
  pruneState,
  saveState,
  vacancyId,
} from "./state.ts";
import { sendMessages } from "./telegram/api.ts";
import { formatDigest } from "./telegram/format.ts";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const stateKey = process.env.STATE_KEY;
const dryRun = process.argv.includes("--dry-run");
const now = new Date();

if (!stateKey) throw new Error("STATE_KEY is required: see README, Setup");

// In GitHub Actions a missing secret must fail the run, not silently turn into a preview.
if (process.env.CI && !dryRun && (!token || !chatId)) {
  throw new Error(
    "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID secrets are required in CI",
  );
}

const { vacancies, errors } = await fetchAll();
if (vacancies.length === 0) {
  throw new Error(`No vacancies from any source: ${errors.join("; ")}`);
}

const send = !dryRun && token && chatId;
let state = await loadState();
// Pick up clicks made since the last sync, so decided vacancies do not come back today.
if (send) state = await syncDecisions(token, chatId, state, now);

const digest = buildDigest(
  vacancies,
  state.vacancies,
  (link) => vacancyId(link, stateKey),
  now,
);
const messages = formatDigest(digest, errors, now);

if (!send) {
  // A preview must not mark vacancies as shown.
  console.log(messages.map((m) => m.text).join("\n\n---\n\n"));
  console.log("\nFiltered out:", digest.excluded);
} else {
  await sendMessages(token, chatId, messages);
  // Save only after Telegram accepted the digest: a failed send is retried next time.
  const shown = [...digest.fresh, ...digest.reminders].map((item) => item.id);
  await saveState(pruneState(markShown(state, shown, now), now));
  console.log(
    `Sent ${shown.length} vacancies in ${messages.length} message(s).`,
  );
}
