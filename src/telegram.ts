import type { Digest } from "./rank/digest.ts";
import type { ScoredVacancy } from "./types.ts";

// Telegram rejects messages over 4096 characters; keep a margin.
const MAX_MESSAGE_LENGTH = 4000;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatVacancy(vacancy: ScoredVacancy, position: number): string {
  const lines = [
    `<b>${position}. ${escapeHtml(vacancy.title)}</b> — ${vacancy.score}/100 · ${vacancy.source}`,
    ...vacancy.reasons.map((reason) => `✅ ${escapeHtml(reason)}`),
    ...vacancy.warnings.map((warning) => `⚠️ ${escapeHtml(warning)}`),
    vacancy.link,
  ];
  return lines.join("\n");
}

export function formatDigest(
  digest: Digest,
  errors: string[],
  now: Date,
): string[] {
  const date = now.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Kyiv",
  });
  const excludedTotal = Object.values(digest.excluded).reduce(
    (sum, n) => sum + n,
    0,
  );

  const header = [
    `<b>Вакансии на ${date}</b>`,
    `Новых в подборке: ${digest.top.length}. Просмотрено: ${digest.total}, отсеяно: ${excludedTotal}.`,
  ];
  if (digest.top.length === 0) header.push("Сегодня ничего нового не подошло.");
  if (errors.length > 0)
    header.push(`❗ Источники с ошибкой: ${escapeHtml(errors.join("; "))}`);

  const footer =
    "Понравилась вакансия — принеси ссылку в Claude, разберём под резюме.";
  const blocks = [
    header.join("\n"),
    ...digest.top.map((v, i) => formatVacancy(v, i + 1)),
  ];
  if (digest.top.length > 0) blocks.push(footer);

  return splitIntoMessages(blocks);
}

export function splitIntoMessages(blocks: string[]): string[] {
  const messages: string[] = [];
  let current = "";

  for (const block of blocks) {
    const candidate = current ? `${current}\n\n${block}` : block;
    if (candidate.length > MAX_MESSAGE_LENGTH && current) {
      messages.push(current);
      current = block;
    } else {
      current = candidate;
    }
  }

  if (current) messages.push(current);
  return messages;
}

export async function sendMessages(
  token: string,
  chatId: string,
  messages: string[],
): Promise<void> {
  for (const text of messages) {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        }),
      },
    );

    if (!response.ok) {
      // The body explains what is wrong ("chat not found", "can't parse entities") and never contains the token.
      throw new Error(
        `Telegram: HTTP ${response.status} ${await response.text()}`,
      );
    }
  }
}
