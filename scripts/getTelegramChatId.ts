/**
 * Prints the chat id of the most recent message sent to your bot.
 * Run with: npm run get-telegram-chat-id
 * Requires TELEGRAM_BOT_TOKEN set in .env. Send your bot any message
 * first (e.g. /start), then run this script.
 */
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ Set TELEGRAM_BOT_TOKEN in .env first.');
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = (await response.json()) as {
  ok: boolean;
  result: Array<{ message?: { chat: { id: number; first_name?: string; title?: string } } }>;
};

if (!data.ok) {
  console.error('❌ Telegram API error — check your TELEGRAM_BOT_TOKEN.');
  process.exit(1);
}

const messages = data.result.filter((u) => u.message);

if (messages.length === 0) {
  console.log(
    '⚠️  No messages found. Send your bot a message (e.g. /start) on Telegram, then run this again.'
  );
  process.exit(1);
}

const last = messages[messages.length - 1].message!;
console.log(`\n✅ Chat ID for ${last.chat.first_name || last.chat.title || 'this chat'}:\n`);
console.log(`TELEGRAM_CHAT_ID=${last.chat.id}\n`);
