import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";

import {
  daysSince,
  decide,
  emptyState,
  loadState,
  markShown,
  pruneState,
  saveState,
  vacancyId,
} from "../src/state.ts";

const NOW = new Date("2026-11-05T07:30:00Z");

describe("vacancyId", () => {
  const link = "https://djinni.co/jobs/1/";

  it("is short and stable for the same key", () => {
    const id = vacancyId(link, "key");
    assert.equal(id.length, 16);
    assert.equal(vacancyId(link, "key"), id);
  });

  it("depends on the key", () => {
    assert.notEqual(vacancyId(link, "key"), vacancyId(link, "other"));
  });
});

describe("markShown", () => {
  it("sets today's date and keeps the decision", () => {
    const state = decide(emptyState(), "a", "applied", new Date("2026-11-01"));
    const next = markShown(state, ["a", "b"], NOW);
    assert.deepEqual(next.vacancies, {
      a: { shownAt: "2026-11-05", decision: "applied" },
      b: { shownAt: "2026-11-05" },
    });
  });

  it("does not mutate the original state", () => {
    const state = emptyState();
    markShown(state, ["a"], NOW);
    assert.deepEqual(state, emptyState());
  });
});

describe("decide", () => {
  it("keeps the date the vacancy was shown", () => {
    const shown = markShown(emptyState(), ["a"], new Date("2026-11-01"));
    assert.deepEqual(decide(shown, "a", "rejected", NOW).vacancies.a, {
      shownAt: "2026-11-01",
      decision: "rejected",
    });
  });

  it("removes the decision on undo", () => {
    const applied = decide(emptyState(), "a", "applied", NOW);
    assert.deepEqual(decide(applied, "a", undefined, NOW).vacancies.a, {
      shownAt: "2026-11-05",
    });
  });
});

describe("pruneState", () => {
  it("drops entries shown more than 120 days ago", () => {
    const state = {
      updateOffset: 7,
      vacancies: {
        old: { shownAt: "2026-06-01" },
        fresh: { shownAt: "2026-11-01" },
      },
    };
    assert.deepEqual(pruneState(state, NOW), {
      updateOffset: 7,
      vacancies: { fresh: { shownAt: "2026-11-01" } },
    });
  });
});

describe("daysSince", () => {
  it("counts whole days", () => {
    assert.equal(daysSince("2026-11-02", NOW), 3);
    assert.equal(daysSince("2026-11-05", NOW), 0);
  });
});

describe("loadState / saveState", () => {
  it("starts empty when the file does not exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "state-"));
    try {
      const path = pathToFileURL(join(dir, "missing.json"));
      assert.deepEqual(await loadState(path), emptyState());
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it("saves and loads the same data", async () => {
    const dir = await mkdtemp(join(tmpdir(), "state-"));
    const path = pathToFileURL(join(dir, "state.json"));
    const state = {
      updateOffset: 42,
      vacancies: {
        b: { shownAt: "2026-11-05" },
        a: { shownAt: "2026-11-04", decision: "applied" as const },
      },
    };
    try {
      await saveState(state, path);
      assert.deepEqual(await loadState(path), state);
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
