import type { ScoredVacancy, Vacancy } from "./types.ts";
import { scoreVacancy } from "./score.ts";

export const TOP_SIZE = 10;
const MAX_AGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Digest = {
  top: ScoredVacancy[];
  total: number;
  excluded: Record<string, number>;
};

export function buildDigest(
  vacancies: Vacancy[],
  seen: ReadonlySet<string>,
  now: Date,
): Digest {
  const unique = new Map<string, Vacancy>();
  for (const vacancy of vacancies) unique.set(vacancy.link, vacancy);

  const excluded: Record<string, number> = {};
  const scored: ScoredVacancy[] = [];

  for (const vacancy of unique.values()) {
    if (seen.has(vacancy.link)) continue;

    const age = now.getTime() - new Date(vacancy.publishedAt).getTime();
    if (age > MAX_AGE_DAYS * DAY_MS) continue;

    const verdict = scoreVacancy(vacancy);
    if (verdict.kind === "excluded") {
      excluded[verdict.reason] = (excluded[verdict.reason] ?? 0) + 1;
      continue;
    }

    scored.push({ ...vacancy, ...verdict });
  }

  // Best score first; among equals the fresher one wins.
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return { top: scored.slice(0, TOP_SIZE), total: unique.size, excluded };
}
