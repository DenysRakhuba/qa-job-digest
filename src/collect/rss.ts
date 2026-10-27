import { XMLParser } from "fast-xml-parser";

import type { Source, Vacancy } from "../types.ts";
import { decodeEntities, htmlToText, normalizeLink } from "./clean.ts";

const USER_AGENT = "job-search-digest (personal, 1 request/day)";

type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export function parseRss(xml: string, source: Source): Vacancy[] {
  const parser = new XMLParser({ isArray: (name) => name === "item" });
  const feed = parser.parse(xml) as {
    rss?: { channel?: { item?: RssItem[] } };
  };
  const items = feed.rss?.channel?.item ?? [];

  return items.map((item) => ({
    source,
    title: decodeEntities(String(item.title)),
    link: normalizeLink(item.link),
    description: htmlToText(String(item.description ?? "")),
    publishedAt: item.pubDate,
  }));
}

export async function fetchRss(
  url: string,
  source: Source,
): Promise<Vacancy[]> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!response.ok) {
    throw new Error(`${source} RSS: HTTP ${response.status}`);
  }

  return parseRss(await response.text(), source);
}
