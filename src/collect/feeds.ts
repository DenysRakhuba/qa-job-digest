import type { Source, Vacancy } from "../types.ts";
import { fetchRss } from "./rss.ts";

const FEEDS: Record<Source, string> = {
  dou: "https://jobs.dou.ua/vacancies/feeds/?category=QA&search=automation",
  djinni: "https://djinni.co/jobs/rss/?primary_keyword=QA%20Automation",
};

export type FetchResult = {
  vacancies: Vacancy[];
  errors: string[];
};

export async function fetchAll(): Promise<FetchResult> {
  const entries = Object.entries(FEEDS) as [Source, string][];
  const results = await Promise.allSettled(
    entries.map(([source, url]) => fetchRss(url, source)),
  );

  const vacancies: Vacancy[] = [];
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      vacancies.push(...result.value);
    } else {
      errors.push(`${entries[index][0]}: ${String(result.reason)}`);
    }
  });

  return { vacancies, errors };
}
