import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { pathToFileURL } from "node:url";

import { loadSeen, markSeen, pruneSeen, saveSeen } from "../src/seen.ts";

const NOW = new Date("2026-10-28T06:00:00Z");

describe("seen store", () => {
  it("marks links with today's date", () => {
    assert.deepEqual(markSeen({}, ["a", "b"], NOW), {
      a: "2026-10-28",
      b: "2026-10-28",
    });
  });

  it("does not mutate the original store", () => {
    const store = { a: "2026-10-01" };
    markSeen(store, ["b"], NOW);
    assert.deepEqual(store, { a: "2026-10-01" });
  });

  it("drops entries older than 120 days", () => {
    assert.deepEqual(
      pruneSeen({ old: "2026-01-01", fresh: "2026-10-01" }, NOW),
      { fresh: "2026-10-01" },
    );
  });

  it("returns an empty store when the file does not exist", async () => {
    const dir = await mkdtemp(join(tmpdir(), "seen-"));
    try {
      assert.deepEqual(
        await loadSeen(pathToFileURL(join(dir, "missing.json"))),
        {},
      );
    } finally {
      await rm(dir, { recursive: true });
    }
  });

  it("saves and loads the same data", async () => {
    const dir = await mkdtemp(join(tmpdir(), "seen-"));
    const path = pathToFileURL(join(dir, "seen.json"));
    try {
      await saveSeen({ b: "2026-10-28", a: "2026-10-27" }, path);
      assert.deepEqual(await loadSeen(path), {
        a: "2026-10-27",
        b: "2026-10-28",
      });
    } finally {
      await rm(dir, { recursive: true });
    }
  });
});
