import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDigest, TOP_SIZE } from "./digest.ts";
import type { Vacancy } from "./types.ts";

const NOW = new Date("2026-10-28T06:00:00Z");

function vacancy(
  id: number,
  description: string,
  publishedAt = "Tue, 27 Oct 2026 12:00:00 +0200",
): Vacancy {
  return {
    source: "djinni",
    title: "QA Automation Engineer",
    link: `https://djinni.co/jobs/${id}/`,
    description,
    publishedAt,
  };
}

describe("buildDigest", () => {
  it("skips vacancies that were already shown", () => {
    const digest = buildDigest(
      [vacancy(1, "Playwright, remote")],
      new Set(["https://djinni.co/jobs/1/"]),
      NOW,
    );
    assert.equal(digest.top.length, 0);
  });

  it("counts the same link only once", () => {
    const digest = buildDigest(
      [vacancy(1, "Playwright, remote"), vacancy(1, "Playwright, remote")],
      new Set(),
      NOW,
    );
    assert.equal(digest.total, 1);
    assert.equal(digest.top.length, 1);
  });

  it("skips vacancies older than 30 days", () => {
    const digest = buildDigest(
      [vacancy(1, "Playwright, remote", "Mon, 01 Sep 2026 12:00:00 +0300")],
      new Set(),
      NOW,
    );
    assert.equal(digest.top.length, 0);
  });

  it("counts excluded vacancies by reason", () => {
    const digest = buildDigest(
      [vacancy(1, "Playwright, crypto, remote")],
      new Set(),
      NOW,
    );
    assert.deepEqual(digest.excluded, { "крипта/Web3": 1 });
  });

  it("puts the best match first and keeps at most TOP_SIZE", () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      vacancy(i, "Java, Selenium, remote"),
    );
    const best = vacancy(99, "Playwright, TypeScript, remote");
    const digest = buildDigest([...many, best], new Set(), NOW);
    assert.equal(digest.top.length, TOP_SIZE);
    assert.equal(digest.top[0].link, best.link);
  });
});
