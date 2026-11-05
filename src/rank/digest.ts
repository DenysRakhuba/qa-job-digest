import { daysSince, type VacancyState } from "../state.ts";
import type { ScoredVacancy, Vacancy } from "../types.ts";
import { scoreVacancy } from "./score.ts";

export const TOP_SIZE = 10;
export const REMINDER_SIZE = 5;
const REMIND_AFTER_DAYS = 3;
const MAX_AGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DigestItem = ScoredVacancy & { id: string };

export type Digest = {
  fresh: DigestItem[];
  // Shown before, still in the feed, still no decision.
  reminders: DigestItem[];
  total: number;
  excluded: Record<string, number>;
};

export function buildDigest(
  vacancies: Vacancy[],
  known: Record<string, VacancyState>,
  idOf: (link: string) => string,
  now: Date,
): Digest {
  const unique = new Map<string, Vacancy>();
  for (const vacancy of vacancies) unique.set(vacancy.link, vacancy);

  const excluded: Record<string, number> = {};
  const fresh: DigestItem[] = [];
  const reminders: DigestItem[] = [];

  for (const vacancy of unique.values()) {
    const id = idOf(vacancy.link);
    const entry = known[id];
    if (entry?.decision) continue;

    const age = now.getTime() - new Date(vacancy.publishedAt).getTime();
    if (age > MAX_AGE_DAYS * DAY_MS) continue;

    const verdict = scoreVacancy(vacancy);
    if (verdict.kind === "excluded") {
      excluded[verdict.reason] = (excluded[verdict.reason] ?? 0) + 1;
      continue;
    }

    const item = { ...vacancy, ...verdict, id };
    if (!entry) fresh.push(item);
    else if (daysSince(entry.shownAt, now) >= REMIND_AFTER_DAYS) {
      reminders.push(item);
    }
  }

  return {
    fresh: fresh.sort(byScore).slice(0, TOP_SIZE),
    reminders: reminders.sort(byScore).slice(0, REMINDER_SIZE),
    total: unique.size,
    excluded,
  };
}

// Best score first; among equals the fresher one wins.
function byScore(a: DigestItem, b: DigestItem): number {
  return (
    b.score - a.score ||
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
