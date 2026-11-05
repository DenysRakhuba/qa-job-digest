import { createHmac } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

export type Decision = "applied" | "rejected";

export type VacancyState = {
  // Last day the vacancy was sent (YYYY-MM-DD).
  shownAt: string;
  decision?: Decision;
};

export type State = {
  // Next Telegram update_id to read, so button clicks are processed once.
  updateOffset: number;
  vacancies: Record<string, VacancyState>;
};

export const STATE_PATH = new URL("../data/state.json", import.meta.url);
const KEEP_DAYS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

// The repository is public: a keyed hash hides which vacancies were applied to,
// while a plain hash of a public link could be matched by anyone.
export function vacancyId(link: string, key: string): string {
  return createHmac("sha256", key)
    .update(link)
    .digest("base64url")
    .slice(0, 16);
}

export function emptyState(): State {
  return { updateOffset: 0, vacancies: {} };
}

export async function loadState(path: URL = STATE_PATH): Promise<State> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as State;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
    throw error;
  }
}

export async function saveState(
  state: State,
  path: URL = STATE_PATH,
): Promise<void> {
  // Sorted keys give small, readable git diffs.
  const vacancies = Object.fromEntries(
    Object.entries(state.vacancies).sort(([a], [b]) => a.localeCompare(b)),
  );
  const json = JSON.stringify({ ...state, vacancies }, null, 2);
  await writeFile(path, `${json}\n`);
}

export function markShown(state: State, ids: string[], now: Date): State {
  const vacancies = { ...state.vacancies };
  for (const id of ids) {
    vacancies[id] = { ...vacancies[id], shownAt: toDay(now) };
  }
  return { ...state, vacancies };
}

// No decision means "undo": the vacancy goes back to the waiting list.
export function decide(
  state: State,
  id: string,
  decision: Decision | undefined,
  now: Date,
): State {
  const shownAt = state.vacancies[id]?.shownAt ?? toDay(now);
  const entry: VacancyState = decision ? { shownAt, decision } : { shownAt };
  return { ...state, vacancies: { ...state.vacancies, [id]: entry } };
}

// Feeds only cover the last few weeks, so old entries can go.
export function pruneState(state: State, now: Date): State {
  const cutoff = now.getTime() - KEEP_DAYS * DAY_MS;
  const vacancies = Object.fromEntries(
    Object.entries(state.vacancies).filter(
      ([, entry]) => new Date(entry.shownAt).getTime() >= cutoff,
    ),
  );
  return { ...state, vacancies };
}

export function daysSince(day: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(day).getTime()) / DAY_MS);
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
