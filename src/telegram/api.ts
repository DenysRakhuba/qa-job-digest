import { setTimeout as sleep } from "node:timers/promises";

export type Button = { text: string; callback_data: string };
export type Keyboard = Button[][];

export type OutgoingMessage = {
  text: string;
  keyboard?: Keyboard;
  silent?: boolean;
};

export type Update = {
  update_id: number;
  callback_query?: {
    data?: string;
    message?: { message_id: number; chat: { id: number } };
  };
};

// Telegram asks bots to stay around one message per second in a chat.
const SEND_INTERVAL_MS = 1000;

async function call<T>(
  token: string,
  method: string,
  body: object,
): Promise<T> {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    // The body explains what is wrong ("chat not found", "can't parse entities") and never contains the token.
    throw new Error(
      `Telegram ${method}: HTTP ${response.status} ${await response.text()}`,
    );
  }
  const data = (await response.json()) as { result: T };
  return data.result;
}

export async function sendMessages(
  token: string,
  chatId: string,
  messages: OutgoingMessage[],
): Promise<void> {
  for (const [index, message] of messages.entries()) {
    if (index > 0) await sleep(SEND_INTERVAL_MS);
    await call(token, "sendMessage", {
      chat_id: chatId,
      text: message.text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      disable_notification: message.silent ?? false,
      ...(message.keyboard && {
        reply_markup: { inline_keyboard: message.keyboard },
      }),
    });
  }
}

export function getUpdates(token: string, offset: number): Promise<Update[]> {
  return call(token, "getUpdates", { offset });
}

export async function editKeyboard(
  token: string,
  chatId: string,
  messageId: number,
  keyboard: Keyboard,
): Promise<void> {
  await call(token, "editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: keyboard },
  });
}
