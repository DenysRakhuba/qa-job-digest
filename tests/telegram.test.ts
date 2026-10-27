import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Digest } from "../src/rank/digest.ts";
import {
  escapeHtml,
  formatDigest,
  splitIntoMessages,
} from "../src/telegram.ts";

const NOW = new Date("2026-10-28T06:00:00Z");

describe("escapeHtml", () => {
  it("escapes the characters Telegram HTML cares about", () => {
    assert.equal(
      escapeHtml("QA <Manual & Auto>"),
      "QA &lt;Manual &amp; Auto&gt;",
    );
  });
});

describe("splitIntoMessages", () => {
  it("keeps short blocks in one message", () => {
    assert.deepEqual(splitIntoMessages(["a", "b"]), ["a\n\nb"]);
  });

  it("starts a new message before the 4096 limit", () => {
    const block = "x".repeat(3000);
    const messages = splitIntoMessages([block, block]);
    assert.equal(messages.length, 2);
    assert.ok(messages.every((m) => m.length <= 4096));
  });
});

describe("formatDigest", () => {
  const digest: Digest = {
    total: 30,
    excluded: { Senior: 5, "крипта/Web3": 2 },
    top: [
      {
        source: "dou",
        title: "Middle QA Automation в A & B",
        link: "https://jobs.dou.ua/companies/ab/vacancies/1/",
        description: "",
        publishedAt: "Tue, 27 Oct 2026 12:00:00 +0200",
        score: 90,
        reasons: ["Playwright + TypeScript — твой основной стек"],
        warnings: ["формат работы не указан"],
      },
    ],
  };

  it("shows score, reasons, warnings and link", () => {
    const [message] = formatDigest(digest, [], NOW);
    assert.match(
      message,
      /<b>1\. Middle QA Automation в A &amp; B<\/b> — 90\/100/,
    );
    assert.match(message, /✅ Playwright \+ TypeScript/);
    assert.match(message, /⚠️ формат работы не указан/);
    assert.match(
      message,
      /https:\/\/jobs\.dou\.ua\/companies\/ab\/vacancies\/1\//,
    );
    assert.match(message, /отсеяно: 7/);
  });

  it("says so when nothing new matched", () => {
    const [message] = formatDigest({ ...digest, top: [] }, [], NOW);
    assert.match(message, /ничего нового не подошло/);
  });

  it("reports a broken source", () => {
    const [message] = formatDigest(digest, ["djinni: HTTP 503"], NOW);
    assert.match(message, /Источники с ошибкой: djinni: HTTP 503/);
  });
});
