import { fetchAll } from "./collect/feeds.ts";
import { buildDigest } from "./digest.ts";
import { loadSeen, markSeen, pruneSeen, saveSeen } from "./seen.ts";
import { formatDigest, sendMessages } from "./telegram.ts";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const dryRun = process.argv.includes("--dry-run");
const now = new Date();

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

const seen = await loadSeen();
const digest = buildDigest(vacancies, new Set(Object.keys(seen)), now);
const messages = formatDigest(digest, errors, now);

if (dryRun || !token || !chatId) {
  // Local preview (or no Telegram secrets): print and do not touch seen.json, so the real run still shows these.
  console.log(messages.join("\n\n---\n\n"));
  console.log("\nОтсеяно:", digest.excluded);
} else {
  await sendMessages(token, chatId, messages);
  // Save only after Telegram accepted the digest: a failed send is retried tomorrow.
  const shown = digest.top.map((v) => v.link);
  await saveSeen(pruneSeen(markSeen(seen, shown, now), now));
  console.log(
    `Sent ${digest.top.length} vacancies in ${messages.length} message(s).`,
  );
}
