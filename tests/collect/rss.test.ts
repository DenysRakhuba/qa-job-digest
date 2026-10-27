import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseRss } from "../../src/collect/rss.ts";

const ONE_ITEM = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel><title>DOU</title>
<item>
  <title>Senior QA Engineer (Manual &amp;amp; Automation) в Fortyve, Київ</title>
  <link>https://jobs.dou.ua/companies/fortyve/vacancies/377955/?utm_source=jobsrss</link>
  <description>&lt;p&gt;Need &lt;strong&gt;Playwright&lt;/strong&gt;&lt;/p&gt;</description>
  <pubDate>Tue, 27 Oct 2026 12:54:30 +0200</pubDate>
</item>
</channel></rss>`;

describe("parseRss", () => {
  it("returns an array even for a single item", () => {
    assert.equal(parseRss(ONE_ITEM, "dou").length, 1);
  });

  it("cleans title, link and description", () => {
    const [vacancy] = parseRss(ONE_ITEM, "dou");
    assert.deepEqual(vacancy, {
      source: "dou",
      title: "Senior QA Engineer (Manual & Automation) в Fortyve, Київ",
      link: "https://jobs.dou.ua/companies/fortyve/vacancies/377955/",
      description: "Need Playwright",
      publishedAt: "Tue, 27 Oct 2026 12:54:30 +0200",
    });
  });

  it("returns an empty list for an empty feed", () => {
    assert.deepEqual(parseRss("<rss><channel></channel></rss>", "djinni"), []);
  });
});
