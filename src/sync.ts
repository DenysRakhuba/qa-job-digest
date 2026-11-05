import { syncDecisions } from "./decisions.ts";
import { loadState, saveState } from "./state.ts";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
if (!token || !chatId) {
  throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required");
}

const state = await loadState();
await saveState(await syncDecisions(token, chatId, state, new Date()));
