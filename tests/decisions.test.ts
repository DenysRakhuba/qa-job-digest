import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyUpdates, parseCallback } from "../src/decisions.ts";
import { emptyState, markShown } from "../src/state.ts";
import type { Update } from "../src/telegram/api.ts";

const NOW = new Date("2026-11-05T07:30:00Z");
const CHAT = "100";

function click(updateId: number, data: string, chatId = 100): Update {
  return {
    update_id: updateId,
    callback_query: {
      data,
      message: { message_id: updateId * 10, chat: { id: chatId } },
    },
  };
}

describe("parseCallback", () => {
  it("reads the action and the vacancy id", () => {
    assert.deepEqual(parseCallback("applied:abc"), {
      action: "applied",
      id: "abc",
    });
    assert.deepEqual(parseCallback("undo:abc"), { action: "undo", id: "abc" });
  });

  it("ignores anything else", () => {
    assert.equal(parseCallback("delete:abc"), undefined);
    assert.equal(parseCallback("applied:"), undefined);
  });
});

describe("applyUpdates", () => {
  const shown = markShown(emptyState(), ["a", "b"], new Date("2026-11-04"));

  it("records decisions and the messages to update", () => {
    const { state, clicks } = applyUpdates(
      shown,
      [click(1, "applied:a"), click(2, "rejected:b")],
      CHAT,
      NOW,
    );
    assert.equal(state.vacancies.a.decision, "applied");
    assert.equal(state.vacancies.b.decision, "rejected");
    assert.deepEqual(clicks, [
      { messageId: 10, id: "a", decision: "applied" },
      { messageId: 20, id: "b", decision: "rejected" },
    ]);
  });

  it("lets the last click win, including undo", () => {
    const { state } = applyUpdates(
      shown,
      [click(1, "applied:a"), click(2, "undo:a")],
      CHAT,
      NOW,
    );
    assert.equal(state.vacancies.a.decision, undefined);
  });

  it("moves the offset past every update, even ignored ones", () => {
    const message: Update = { update_id: 7 };
    const { state } = applyUpdates(
      shown,
      [click(5, "applied:a"), message],
      CHAT,
      NOW,
    );
    assert.equal(state.updateOffset, 8);
  });

  it("ignores clicks from other chats", () => {
    const { state, clicks } = applyUpdates(
      shown,
      [click(1, "applied:a", 999)],
      CHAT,
      NOW,
    );
    assert.equal(state.vacancies.a.decision, undefined);
    assert.equal(clicks.length, 0);
  });
});
