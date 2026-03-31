const axios = require('axios');
const cheerio = require('cheerio');
const { BASE_PRICES } = require('../utils/constants');

// ─────────────────────────────────────────────
// Scrape gold PRICE from logammulia.com
// ─────────────────────────────────────────────
async function scrapeGoldPrice() {
  try {
    const response = await axios.get('https://www.logammulia.com/id/harga-emas-hari-ini', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'id-ID,id;q=0.9',
      },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);
    const prices = [];

    $('table tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const weightText = $(cells[0]).text().trim();
        const buyText    = $(cells[1]).text().trim();
        const sellText   = cells.length >= 3 ? $(cells[2]).text().trim() : '';
        const weight     = parseFloat(weightText.replace(/[^0-9.]/g, ''));
        const buyPrice   = parseInt(buyText.replace(/[^0-9]/g, ''));
        const sellPrice  = parseInt(sellText.replace(/[^0-9]/g, ''));
        if (weight && buyPrice) {
          prices.push({
            weight,
            buyPrice,
            sellPrice: sellPrice || Math.round(buyPrice * 0.97),
          });
        }
      }
    });

    if (prices.length >= 3) return prices;
    return generateSimulatedPrices();
  } catch (err) {
    console.log('[Scraper] Using simulated price data:', err.message);
    return generateSimulatedPrices();
  }
}

function generateSimulatedPrices() {
  const today = new Date();
  const trend = Math.sin(today.getDate() * 0.3) * 0.008;
  return Object.entries(BASE_PRICES).map(([weight, base]) => {
    const variation = 1 + trend + (Math.random() - 0.5) * 0.004;
    const buyPrice  = Math.round(base * variation);
    return { weight: parseFloat(weight), buyPrice, sellPrice: Math.round(buyPrice * 0.97), isSimulated: true };
  });
}

// ─────────────────────────────────────────────
// Scrape STOCK from logammulia.com product page
//
// IMPORTANT: logammulia.com renders stock data
// via JavaScript (SPA). Axios/cheerio scraping
// cannot reliably obtain real stock status.
//
// Strategy:
//   1. Try to hit the product detail page and
//      look for known "habis" / "out of stock"
//      indicators in the HTML.
//   2. If the page returns a clear "out of stock"
//      signal → inStock = false, isSimulated = false
//   3. If we CANNOT determine with certainty
//      → return isSimulated = true (NO notification sent)
//
// Rule: we only send Telegram notifications when
// isSimulated === false AND inStock === true.
// ─────────────────────────────────────────────
async function scrapeStockByBoutique(boutiqueId, weightGram) {
  // Map weight to product slug on logammulia.com
  const WEIGHT_SLUG_MAP = {
    0.5: 'emas-klasik-0-5',
    1:   'emas-klasik-1',
    2:   'emas-klasik-2',
    3:   'emas-klasik-3',
    5:   'emas-klasik-5',
    10:  'emas-klasik-10',
    25:  'emas-klasik-25',
    50:  'emas-klasik-50',
    100: 'emas-klasik-100',
  };

  const slug = WEIGHT_SLUG_MAP[weightGram];

  if (slug) {
    try {
      const url = `https://www.logammulia.com/product/${slug}`;
      const { data: html } = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'id-ID,id;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 12000,
      });

      const $ = cheerio.load(html);
      const bodyText = $.text().toLowerCase();
      const htmlLower = html.toLowerCase();

      // ── Definitive OUT OF STOCK indicators ──────────────────
      // These phrases appear in the HTML when stock is empty.
      const OUT_OF_STOCK_SIGNALS = [
        'stok habis',
        'stock habis',
        'out of stock',
        'habis',
        'sold out',
        'tidak tersedia',
        'stok tidak tersedia',
        // CSS class / attribute patterns
        'btn-out-of-stock',
        'out_of_stock',
        'is-disabled',
      ];

      // Look in both text and raw HTML for out-of-stock signals
      const isDefinitelyOutOfStock = OUT_OF_STOCK_SIGNALS.some(signal =>
        bodyText.includes(signal) || htmlLower.includes(signal)
      );

      // ── Definitive IN STOCK indicators ──────────────────────
      // The buy button / add-to-cart is present and NOT disabled
      const IN_STOCK_SIGNALS = [
        'tambah ke keranjang',
        'add to cart',
        'beli sekarang',
        'buy now',
      ];

      const hasAddToCart = IN_STOCK_SIGNALS.some(signal => bodyText.includes(signal));

      // Check if the add-to-cart button is disabled
      let cartButtonDisabled = false;
      $('button, a').each((_, el) => {
        const txt = $(el).text().toLowerCase();
        if (txt.includes('tambah ke keranjang') || txt.includes('add to cart')) {
          const cls = ($(el).attr('class') || '').toLowerCase();
          const disabled = $(el).attr('disabled');
          if (cls.includes('disabled') || cls.includes('out-of-stock') || disabled !== undefined) {
            cartButtonDisabled = true;
          }
        }
      });

      if (isDefinitelyOutOfStock || cartButtonDisabled) {
        // Confirmed: out of stock
        return {
          inStock:      false,
          quantity:     0,
          checkedAt:    new Date().toISOString(),
          isSimulated:  false,
          message:      'Stok habis (dikonfirmasi dari logammulia.com)',
        };
      }

      if (hasAddToCart && !cartButtonDisabled) {
        // The page has an active add-to-cart — BUT boutique-specific
        // stock is set via JS after page load. We can confirm the product
        // exists but cannot confirm stock for the specific boutique.
        // → Return isSimulated = true to prevent false notification.
        console.log(`[Scraper] Product ${slug} page loaded but boutique-specific stock requires JS. Skipping notification.`);
        return {
          inStock:      null,   // unknown
          quantity:     null,
          checkedAt:    new Date().toISOString(),
          isSimulated:  true,
          message:      'Stok per butik memerlukan JavaScript untuk dikonfirmasi. Notifikasi dinonaktifkan.',
        };
      }

      // Page retrieved but state is ambiguous
      console.log(`[Scraper] Stock status ambiguous for ${slug} at ${boutiqueId}. Skipping notification.`);
      return {
        inStock:      null,
        quantity:     null,
        checkedAt:    new Date().toISOString(),
        isSimulated:  true,
        message:      'Status stok tidak dapat dikonfirmasi dari halaman ini.',
      };

    } catch (err) {
      console.log(`[Scraper] Could not fetch product page for ${slug}:`, err.message);
      // Network error → treat as unknown, do NOT notify
      return {
        inStock:      null,
        quantity:     null,
        checkedAt:    new Date().toISOString(),
        isSimulated:  true,
        message:      `Gagal mengakses halaman produk: ${err.message}`,
      };
    }
  }

  // No slug mapping for this weight → unknown, do NOT notify
  return {
    inStock:      null,
    quantity:     null,
    checkedAt:    new Date().toISOString(),
    isSimulated:  true,
    message:      `Tidak ada pemetaan produk untuk berat ${weightGram}g.`,
  };
}

module.exports = { scrapeGoldPrice, scrapeStockByBoutique };
