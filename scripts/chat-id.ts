const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Put TELEGRAM_BOT_TOKEN into .env first");

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = (await response.json()) as {
  result: {
    message?: { chat: { id: number; first_name?: string; username?: string } };
  }[];
};

const chats = new Map<number, string>();
for (const update of data.result) {
  const chat = update.message?.chat;
  if (chat) chats.set(chat.id, chat.username ?? chat.first_name ?? "");
}

if (chats.size === 0)
  console.log("No messages yet: write anything to the bot and run again.");
for (const [id, name] of chats)
  console.log(`TELEGRAM_CHAT_ID=${id}  (${name})`);
