import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Digest, DigestItem } from "../../src/rank/digest.ts";
import {
  escapeHtml,
  formatDigest,
  keyboard,
} from "../../src/telegram/format.ts";

const NOW = new Date("2026-11-05T07:30:00Z");

const item: DigestItem = {
  id: "abc123",
  source: "dou",
  title: "Middle QA Automation at A & B",
  link: "https://jobs.dou.ua/companies/ab/vacancies/1/",
  description: "",
  publishedAt: "Wed, 04 Nov 2026 12:00:00 +0200",
  score: 90,
  reasons: ["Playwright + TypeScript, the main stack"],
  warnings: ["work format not stated"],
};

const digest: Digest = {
  total: 30,
  excluded: { Senior: 5, "crypto/Web3": 2 },
  fresh: [item],
  reminders: [{ ...item, id: "old456", title: "AQA Engineer" }],
};

describe("escapeHtml", () => {
  it("escapes the characters Telegram HTML cares about", () => {
    assert.equal(
      escapeHtml("QA <Manual & Auto>"),
      "QA &lt;Manual &amp; Auto&gt;",
    );
  });
});

describe("keyboard", () => {
  it("offers both decisions for an undecided vacancy", () => {
    assert.deepEqual(keyboard("abc"), [
      [
        { text: "✅ Applied", callback_data: "applied:abc" },
        { text: "❌ Not a fit", callback_data: "rejected:abc" },
      ],
    ]);
  });

  it("shows the decision with an undo button", () => {
    assert.deepEqual(keyboard("abc", "rejected"), [
      [{ text: "❌ Not a fit · undo", callback_data: "undo:abc" }],
    ]);
  });

  it("fits Telegram's 64-byte callback limit", () => {
    const id = "x".repeat(16);
    for (const button of keyboard(id).flat()) {
      assert.ok(Buffer.byteLength(button.callback_data) <= 64);
    }
  });
});

describe("formatDigest", () => {
  it("starts with a header that notifies", () => {
    const [header] = formatDigest(digest, [], NOW);
    assert.match(header.text, /Vacancies for 5 November/);
    assert.match(header.text, /New: 1\. Awaiting a decision: 1\./);
    assert.match(header.text, /filtered out: 7/);
    assert.equal(header.keyboard, undefined);
    assert.ok(!header.silent);
  });

  it("sends each vacancy silently with its own buttons", () => {
    const [, fresh, reminder] = formatDigest(digest, [], NOW);
    assert.match(
      fresh.text,
      /<b>1\. Middle QA Automation at A &amp; B<\/b> — 90\/100/,
    );
    assert.match(fresh.text, /✅ Playwright \+ TypeScript/);
    assert.match(fresh.text, /⚠️ work format not stated/);
    assert.match(
      fresh.text,
      /https:\/\/jobs\.dou\.ua\/companies\/ab\/vacancies\/1\//,
    );
    assert.deepEqual(fresh.keyboard, keyboard("abc123"));
    assert.equal(fresh.silent, true);
    assert.match(reminder.text, /^<b>🔁 AQA Engineer<\/b>/);
    assert.deepEqual(reminder.keyboard, keyboard("old456"));
  });

  it("says so when nothing matched", () => {
    const messages = formatDigest(
      { ...digest, fresh: [], reminders: [] },
      [],
      NOW,
    );
    assert.equal(messages.length, 1);
    assert.match(messages[0].text, /Nothing new matched/);
  });

  it("reports a broken source", () => {
    const [header] = formatDigest(digest, ["djinni: HTTP 503"], NOW);
    assert.match(header.text, /Sources with errors: djinni: HTTP 503/);
  });
});
