// ============================================================
// LIVE PRICE FETCHING & TICK SIMULATOR SERVICE
// ============================================================

import { ASSETS, CORS_PROXY, YAHOO_MAP } from '../config.js';

export let liveDataAvailable = false;

export async function fetchLiveQuote(yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1m&range=1d`;
  const proxyUrl = CORS_PROXY + encodeURIComponent(url);
  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const parsed = JSON.parse(json.contents);
  const result = parsed?.chart?.result?.[0];
  if (!result) throw new Error('Empty result');
  const price = result.meta?.regularMarketPrice;
  const prevClose = result.meta?.chartPreviousClose || price;
  const changeAmt = price - prevClose;
  const changePct = prevClose ? (changeAmt / prevClose) * 100 : 0;
  return { price, changeAmt, changePct };
}

export function updateTickerItem(yahooSymbol, price, changePct) {
  const el = document.getElementById(`tick-${yahooSymbol}`);
  if (!el) return;
  const priceSpan = el.querySelector('.ticker-price-val');
  const chgSpan   = el.querySelector('.ticker-chg');
  if (priceSpan) priceSpan.textContent = `$${price.toFixed(2)}`;
  if (chgSpan) {
    const sign = changePct >= 0 ? '+' : '';
    chgSpan.textContent = `${sign}${changePct.toFixed(2)}%`;
    chgSpan.className   = `ticker-chg ${changePct >= 0 ? 'positive' : 'negative'}`;
  }
}

export async function refreshAllPrices(onTableUpdate) {
  const statusEl = document.getElementById('ticker-status');
  if (statusEl) { statusEl.textContent = 'Fetching live data...'; statusEl.style.color = 'var(--color-taupe)'; }

  let successCount = 0;

  for (const [arkavaSymbol, yahooSymbol] of Object.entries(YAHOO_MAP)) {
    try {
      const data = await fetchLiveQuote(yahooSymbol);
      if (!data?.price) continue;

      const asset = ASSETS.find(a => a.symbol === arkavaSymbol);
      if (asset) {
        asset.price = data.price;
        asset.liveChangePct = data.changePct;
      }

      const priceEl = document.getElementById(`price-${arkavaSymbol}`);
      if (priceEl) {
        priceEl.textContent = `$${data.price.toFixed(2)}`;
        priceEl.classList.remove('price-flash-green', 'price-flash-red');
        void priceEl.offsetWidth;
        priceEl.classList.add(data.changePct >= 0 ? 'price-flash-green' : 'price-flash-red');
      }

      updateTickerItem(yahooSymbol, data.price, data.changePct);
      successCount++;
    } catch (_e) {
      // API fallback
    }
    await new Promise(r => setTimeout(r, 250));
  }

  liveDataAvailable = successCount > 0;
  const now = new Date();
  if (statusEl) {
    if (liveDataAvailable) {
      statusEl.innerHTML = `<span style="color:var(--color-dark-sage)">● Live</span> · ${now.toLocaleTimeString()}`;
    } else {
      statusEl.textContent = 'Simulated · Markets may be closed';
    }
  }

  if (liveDataAvailable && typeof onTableUpdate === 'function') {
    onTableUpdate();
  }
}

export function startPriceTickSimulation(onTickCallbacks = []) {
  setInterval(() => {
    const randomIndex = Math.floor(Math.random() * ASSETS.length);
    const targetAsset = ASSETS[randomIndex];
    const delta = (Math.random() * 0.004) - 0.002;
    const oldPrice = targetAsset.price;
    targetAsset.price = Math.max(10, targetAsset.price * (1 + delta));
    const isUp = targetAsset.price >= oldPrice;

    const priceEl = document.getElementById(`price-${targetAsset.symbol}`);
    if (priceEl) {
      priceEl.textContent = `$${targetAsset.price.toFixed(2)}`;
      priceEl.classList.remove('price-flash-green', 'price-flash-red');
      void priceEl.offsetWidth;
      priceEl.classList.add(isUp ? 'price-flash-green' : 'price-flash-red');
    }

    if (targetAsset.symbol === 'aAAPL') {
      const heroPrice = document.getElementById('hero-widget-price');
      if (heroPrice) heroPrice.textContent = `$${targetAsset.price.toFixed(2)} USD`;
    }

    const yahooSym = YAHOO_MAP[targetAsset.symbol];
    if (yahooSym) {
      updateTickerItem(yahooSym, targetAsset.price, targetAsset.liveChangePct || 1.20);
    }

    onTickCallbacks.forEach(cb => { if (typeof cb === 'function') cb(); });
  }, 2500);
}
