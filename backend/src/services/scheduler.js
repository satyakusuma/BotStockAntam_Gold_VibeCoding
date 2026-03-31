const cron = require('node-cron');
const prisma = require('../db');
const { scrapeStockByBoutique, scrapeGoldPrice } = require('./scraper');
const { sendTelegramMessage } = require('./telegram');

function startScheduler() {
  // Check stock every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Scheduler] Checking monitored boutiques...');
    await checkAllMonitoredBoutiques();
  });

  // Daily gold price at 09:30 WIB (02:30 UTC)
  cron.schedule('30 2 * * 1-6', async () => {
    console.log('[Scheduler] Sending daily gold price...');
    await sendDailyPriceSummary();
  });

  console.log('[Scheduler] Started ✓');
}

async function checkAllMonitoredBoutiques() {
  try {
    const monitors = await prisma.monitoredBoutique.findMany({
      where: { isActive: true },
      include: { user: { select: { id: true, name: true, telegramToken: true, telegramChatId: true } } },
    });

    for (const monitor of monitors) {
      if (!monitor.user.telegramToken || !monitor.user.telegramChatId) continue;
      try {
        const stock = await scrapeStockByBoutique(monitor.boutiqueId, monitor.weightGram);

        // ── GUARD: skip notification if data is not from real scraping ──
        // isSimulated = true  → data is estimated/unknown, do NOT notify
        // inStock = null      → status ambiguous, do NOT notify
        // inStock = false     → confirmed empty, do NOT notify
        // inStock = true AND isSimulated = false → ONLY case we notify
        if (stock.isSimulated === true) {
          console.log(`[Scheduler] Skipping ${monitor.boutiqueId} ${monitor.weightGram}g — data is simulated, cannot confirm stock.`);
          continue;
        }
        if (stock.inStock !== true) {
          console.log(`[Scheduler] Skipping ${monitor.boutiqueId} ${monitor.weightGram}g — inStock=${stock.inStock}`);
          continue;
        }

        if (stock.inStock === true && stock.isSimulated === false) {
          const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
          const msg =
            `🟡 *STOK EMAS TERSEDIA\\!*\n\n` +
            `📍 *Butik:* ${escapeMarkdown(monitor.boutiqueName)}\n` +
            `⚖️ *Berat:* ${monitor.weightGram} gram\n` +
            (stock.quantity ? `📦 *Stok:* ${stock.quantity} unit\n` : '') +
            `🕐 *Waktu:* ${escapeMarkdown(time)}\n\n` +
            `Segera pesan di [logammulia\\.com](https://logammulia.com) sebelum stok habis\\!\n\n` +
            `_Gold Asset Manager_`;

          await sendTelegramMessage(monitor.user.telegramToken, monitor.user.telegramChatId, msg);
          await prisma.notification.create({
            data: { userId: monitor.userId, type: 'STOCK_ALERT', message: `Stok ${monitor.weightGram}g tersedia di ${monitor.boutiqueName}` },
          });
        }
      } catch (err) {
        console.error(`[Scheduler] Error for boutique ${monitor.boutiqueId}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] checkAllMonitoredBoutiques error:', err);
  }
}

async function sendDailyPriceSummary() {
  try {
    const prices = await scrapeGoldPrice();
    const p = (w) => prices.find(x => x.weight === w);
    const users = await prisma.user.findMany({
      where: { telegramToken: { not: null }, telegramChatId: { not: null } },
    });

    const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' });

    for (const user of users) {
      const [p1, p10, p100] = [p(1), p(10), p(100)];
      if (!p1) continue;
      const msg =
        `🪙 *Update Harga Emas Antam*\n` +
        `📅 ${escapeMarkdown(date)}\n\n` +
        `*1g* — Beli: Rp ${escapeMarkdown(p1.buyPrice.toLocaleString('id-ID'))} \\| Jual: Rp ${escapeMarkdown(p1.sellPrice.toLocaleString('id-ID'))}\n` +
        (p10 ? `*10g* — Beli: Rp ${escapeMarkdown(p10.buyPrice.toLocaleString('id-ID'))} \\| Jual: Rp ${escapeMarkdown(p10.sellPrice.toLocaleString('id-ID'))}\n` : '') +
        (p100 ? `*100g* — Beli: Rp ${escapeMarkdown(p100.buyPrice.toLocaleString('id-ID'))} \\| Jual: Rp ${escapeMarkdown(p100.sellPrice.toLocaleString('id-ID'))}\n` : '') +
        `\n_Sumber: logammulia\\.com_`;

      try {
        await sendTelegramMessage(user.telegramToken, user.telegramChatId, msg);
        await prisma.notification.create({ data: { userId: user.id, type: 'DAILY_SUMMARY', message: 'Update harga emas harian dikirim' } });
      } catch (e) {
        console.error(`[Scheduler] Failed daily summary for user ${user.id}:`, e.message);
      }
    }
  } catch (err) {
    console.error('[Scheduler] sendDailyPriceSummary error:', err);
  }
}

function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

module.exports = { startScheduler };
