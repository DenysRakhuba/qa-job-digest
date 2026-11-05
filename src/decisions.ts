import { decide, type Decision, type State } from "./state.ts";
import { editKeyboard, getUpdates, type Update } from "./telegram/api.ts";
import { keyboard } from "./telegram/format.ts";

type Action = Decision | "undo";

export type Click = { messageId: number; id: string; decision?: Decision };

export function parseCallback(
  data: string,
): { action: Action; id: string } | undefined {
  const match = /^(applied|rejected|undo):(.+)$/.exec(data);
  if (!match) return undefined;
  return { action: match[1] as Action, id: match[2] };
}

export function applyUpdates(
  state: State,
  updates: Update[],
  chatId: string,
  now: Date,
): { state: State; clicks: Click[] } {
  let next = state;
  const clicks: Click[] = [];

  for (const update of updates) {
    next = {
      ...next,
      updateOffset: Math.max(next.updateOffset, update.update_id + 1),
    };

    const query = update.callback_query;
    const message = query?.message;
    // Buttons only exist in the owner's chat; anything else is ignored.
    if (!query?.data || !message || String(message.chat.id) !== chatId)
      continue;

    const parsed = parseCallback(query.data);
    if (!parsed) continue;

    const decision = parsed.action === "undo" ? undefined : parsed.action;
    next = decide(next, parsed.id, decision, now);
    clicks.push({ messageId: message.message_id, id: parsed.id, decision });
  }

  return { state: next, clicks };
}

// Telegram keeps unread updates for 24 hours. The offset is saved together with
// the decisions, so a run that fails before the commit reads the same clicks again.
export async function syncDecisions(
  token: string,
  chatId: string,
  state: State,
  now: Date,
): Promise<State> {
  const updates = await getUpdates(token, state.updateOffset);
  const result = applyUpdates(state, updates, chatId, now);

  for (const click of result.clicks) {
    try {
      await editKeyboard(
        token,
        chatId,
        click.messageId,
        keyboard(click.id, click.decision),
      );
    } catch (error) {
      // A repeated click leaves the keyboard unchanged, which Telegram reports as an error.
      console.warn(`Keyboard not updated: ${(error as Error).message}`);
    }
  }

  console.log(
    `Processed ${updates.length} update(s), ${result.clicks.length} decision(s).`,
  );
  return result.state;
}
