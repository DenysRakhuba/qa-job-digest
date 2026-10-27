import { readFile, writeFile } from "node:fs/promises";

// link -> date it was shown (YYYY-MM-DD). Committed to git by the workflow.
export type SeenStore = Record<string, string>;

export const SEEN_PATH = new URL("../data/seen.json", import.meta.url);
const KEEP_DAYS = 120;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function loadSeen(path: URL = SEEN_PATH): Promise<SeenStore> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

export function markSeen(
  store: SeenStore,
  links: string[],
  now: Date,
): SeenStore {
  const today = now.toISOString().slice(0, 10);
  const next: SeenStore = { ...store };
  for (const link of links) next[link] = today;
  return next;
}

// Feeds only cover the last few weeks, so old entries can go: keeps the file small.
export function pruneSeen(store: SeenStore, now: Date): SeenStore {
  const cutoff = now.getTime() - KEEP_DAYS * DAY_MS;
  return Object.fromEntries(
    Object.entries(store).filter(
      ([, date]) => new Date(date).getTime() >= cutoff,
    ),
  );
}

export async function saveSeen(
  store: SeenStore,
  path: URL = SEEN_PATH,
): Promise<void> {
  // Sorted keys give small, readable git diffs.
  const sorted = Object.fromEntries(
    Object.entries(store).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(path, `${JSON.stringify(sorted, null, 2)}\n`);
}
