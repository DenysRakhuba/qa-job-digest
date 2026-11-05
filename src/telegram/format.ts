import type { Digest, DigestItem } from "../rank/digest.ts";
import type { Decision } from "../state.ts";
import type { Keyboard, OutgoingMessage } from "./api.ts";

const DECISION_LABELS: Record<Decision, string> = {
  applied: "✅ Applied",
  rejected: "❌ Not a fit",
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Callback data is "<action>:<vacancy id>", limited by Telegram to 64 bytes.
export function keyboard(id: string, decision?: Decision): Keyboard {
  if (decision) {
    return [
      [
        {
          text: `${DECISION_LABELS[decision]} · undo`,
          callback_data: `undo:${id}`,
        },
      ],
    ];
  }
  return [
    [
      { text: DECISION_LABELS.applied, callback_data: `applied:${id}` },
      { text: DECISION_LABELS.rejected, callback_data: `rejected:${id}` },
    ],
  ];
}

function formatVacancy(item: DigestItem, label: string): OutgoingMessage {
  const lines = [
    `<b>${label} ${escapeHtml(item.title)}</b> — ${item.score}/100 · ${item.source}`,
    ...item.reasons.map((reason) => `✅ ${escapeHtml(reason)}`),
    ...item.warnings.map((warning) => `⚠️ ${escapeHtml(warning)}`),
    item.link,
  ];
  return { text: lines.join("\n"), keyboard: keyboard(item.id), silent: true };
}

export function formatDigest(
  digest: Digest,
  errors: string[],
  now: Date,
): OutgoingMessage[] {
  const date = now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Helsinki",
  });
  const excludedTotal = Object.values(digest.excluded).reduce(
    (sum, n) => sum + n,
    0,
  );
  const { fresh, reminders } = digest;

  const header = [
    `<b>Vacancies for ${date}</b>`,
    `New: ${fresh.length}. Awaiting a decision: ${reminders.length}. Checked: ${digest.total}, filtered out: ${excludedTotal}.`,
  ];
  if (fresh.length + reminders.length === 0) {
    header.push("Nothing new matched today.");
  } else {
    header.push(
      "Marked vacancies never come back, unmarked ones return in 3 days.",
      "Like one? Bring the link to Claude to tailor the CV.",
    );
  }
  if (errors.length > 0) {
    header.push(`❗ Sources with errors: ${escapeHtml(errors.join("; "))}`);
  }

  return [
    { text: header.join("\n") },
    ...fresh.map((item, i) => formatVacancy(item, `${i + 1}.`)),
    ...reminders.map((item) => formatVacancy(item, "🔁")),
  ];
}
