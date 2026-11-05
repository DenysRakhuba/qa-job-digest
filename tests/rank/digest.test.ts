import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildDigest, REMINDER_SIZE, TOP_SIZE } from "../../src/rank/digest.ts";
import type { VacancyState } from "../../src/state.ts";
import type { Vacancy } from "../../src/types.ts";

const NOW = new Date("2026-11-05T07:30:00Z");
const idOf = (link: string) => link;

function vacancy(
  id: number,
  description: string,
  publishedAt = "Wed, 04 Nov 2026 12:00:00 +0200",
): Vacancy {
  return {
    source: "djinni",
    title: "QA Automation Engineer",
    link: `https://djinni.co/jobs/${id}/`,
    description,
    publishedAt,
  };
}

function build(vacancies: Vacancy[], known: Record<string, VacancyState> = {}) {
  return buildDigest(vacancies, known, idOf, NOW);
}

describe("buildDigest", () => {
  const link = "https://djinni.co/jobs/1/";
  const good = vacancy(1, "Playwright, remote");

  it("puts a new vacancy into fresh", () => {
    const digest = build([good]);
    assert.equal(digest.fresh[0].id, link);
    assert.equal(digest.reminders.length, 0);
  });

  it("never shows a vacancy with a decision again", () => {
    for (const decision of ["applied", "rejected"] as const) {
      const digest = build([good], {
        [link]: { shownAt: "2026-10-01", decision },
      });
      assert.equal(digest.fresh.length + digest.reminders.length, 0);
    }
  });

  it("does not repeat an undecided vacancy for 3 days", () => {
    const digest = build([good], { [link]: { shownAt: "2026-11-03" } });
    assert.equal(digest.fresh.length + digest.reminders.length, 0);
  });

  it("reminds about an undecided vacancy after 3 days", () => {
    const digest = build([good], { [link]: { shownAt: "2026-11-02" } });
    assert.equal(digest.fresh.length, 0);
    assert.equal(digest.reminders[0].id, link);
  });

  it("counts the same link only once", () => {
    const digest = build([good, good]);
    assert.equal(digest.total, 1);
    assert.equal(digest.fresh.length, 1);
  });

  it("skips vacancies older than 30 days", () => {
    const old = vacancy(
      1,
      "Playwright, remote",
      "Mon, 01 Sep 2026 12:00:00 +0300",
    );
    assert.equal(build([old]).fresh.length, 0);
  });

  it("counts excluded vacancies by reason", () => {
    const digest = build([vacancy(1, "Playwright, crypto, remote")]);
    assert.deepEqual(digest.excluded, { "crypto/Web3": 1 });
  });

  it("puts the best match first and limits both lists", () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      vacancy(i + 10, "Java, Selenium, remote"),
    );
    const best = vacancy(99, "Playwright, TypeScript, remote");
    const known = Object.fromEntries(
      many.slice(0, 8).map((v) => [v.link, { shownAt: "2026-10-20" }]),
    );
    const digest = build([...many, best], known);
    assert.equal(digest.fresh.length, TOP_SIZE);
    assert.equal(digest.fresh[0].link, best.link);
    assert.equal(digest.reminders.length, REMINDER_SIZE);
  });
});
