const TelegramBot = require('node-telegram-bot-api');

async function sendTelegramMessage(token, chatId, message) {
  const bot = new TelegramBot(token, { polling: false });
  await bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
}

module.exports = { sendTelegramMessage };
