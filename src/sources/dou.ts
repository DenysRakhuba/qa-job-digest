import { XMLParser } from "fast-xml-parser";
import type { Vacancy } from "../types.ts";

const DOU_URL =
  "https://jobs.dou.ua/vacancies/feeds/?category=QA&search=automation";

type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchDou(): Promise<Vacancy[]> {
  const response = await fetch(DOU_URL, {
    headers: { "User-Agent": "job-search-digest (personal, 1 request/day)" },
  });

  if (!response.ok) {
    throw new Error(`DOU RSS: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({ isArray: (name) => name === "item" });
  const items: RssItem[] = parser.parse(xml).rss.channel.item;

  return items.map((item) => ({
    source: "dou",
    title: item.title,
    link: item.link,
    description: item.description,
    publishedAt: item.pubDate,
  }));
}
