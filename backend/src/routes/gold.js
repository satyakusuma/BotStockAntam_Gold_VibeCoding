const express = require('express');
const prisma = require('../db');
const authMiddleware = require('../middleware/auth');
const { scrapeGoldPrice, scrapeStockByBoutique } = require('../services/scraper');
const { BOUTIQUES, GOLD_WEIGHTS } = require('../utils/constants');
const router = express.Router();
router.use(authMiddleware);

let priceCache = null;
let priceCacheTime = null;
const CACHE_TTL = 15 * 60 * 1000;

router.get('/price', async (req, res) => {
  try {
    const now = Date.now();
    if (priceCache && priceCacheTime && now - priceCacheTime < CACHE_TTL) {
      return res.json(priceCache);
    }
    const rawPrices = await scrapeGoldPrice();

    // Normalize to consistent shape: { weightGram, buyPrice, sellPrice }
    const prices = rawPrices.map(p => ({
      weightGram: p.weightGram || p.weight,
      buyPrice:   p.buyPrice,
      sellPrice:  p.sellPrice,
    }));

    const isSimulated = rawPrices.some(p => p.isSimulated);
    const response = {
      prices,
      lastUpdated: new Date().toISOString(),
      source: isSimulated ? 'fallback' : 'logammulia.com',
    };

    priceCache = response;
    priceCacheTime = now;

    // Save to DB (skip if already saved today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.goldPriceHistory.findFirst({ where: { weightGram: 1, recordedAt: { gte: today } } });
    if (!existing) {
      await prisma.goldPriceHistory.createMany({
        data: prices.map(p => ({ weightGram: p.weightGram, buyPrice: p.buyPrice, sellPrice: p.sellPrice })),
      });
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil harga emas' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const weightGram = parseFloat(req.query.weight) || 1;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await prisma.goldPriceHistory.findMany({
      where: { weightGram, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    });

    if (history.length === 0) {
      return res.json(generateSampleHistory(days, weightGram));
    }
    res.json(history.map(h => ({ ...h, buyPrice: Number(h.buyPrice), sellPrice: Number(h.sellPrice) })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/boutiques', (req, res) => res.json(BOUTIQUES));
router.get('/weights', (req, res) => res.json(GOLD_WEIGHTS));

router.get('/stock', async (req, res) => {
  try {
    const { boutique, weight } = req.query;
    if (!boutique || !weight)
      return res.status(400).json({ message: 'Parameter boutique dan weight diperlukan' });

    const boutiqueInfo = BOUTIQUES.find(b => b.id === boutique);
    if (!boutiqueInfo) return res.status(404).json({ message: 'Butik tidak ditemukan' });

    const stockInfo = await scrapeStockByBoutique(boutique, parseFloat(weight));

    // Normalize response: expose inStock and isSimulated clearly
    res.json({
      boutiqueId:   boutique,
      boutiqueName: boutiqueInfo.name,
      city:         boutiqueInfo.city,
      weightGram:   parseFloat(weight),
      inStock:      stockInfo.inStock,       // true | false | null
      quantity:     stockInfo.quantity,
      checkedAt:    stockInfo.checkedAt,
      isSimulated:  stockInfo.isSimulated,   // true = data tidak real, jangan dipercaya
      message:      stockInfo.message,
      // legacy alias
      isAvailable:  stockInfo.inStock === true,
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengecek stok' });
  }
});

function generateSampleHistory(days, weightGram) {
  const BASE = { 0.5: 840000, 1: 1670000, 2: 3330000, 3: 4975000, 5: 8270000, 10: 16490000, 25: 41175000, 50: 82300000, 100: 164550000 };
  const base = BASE[weightGram] || 1670000 * weightGram;
  return Array.from({ length: days + 1 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const v = (Math.random() - 0.5) * 0.015;
    const buyPrice = Math.round(base * (1 + v));
    return { id: i, weightGram, buyPrice, sellPrice: Math.round(buyPrice * 0.97), recordedAt: date.toISOString() };
  });
}

module.exports = router;
