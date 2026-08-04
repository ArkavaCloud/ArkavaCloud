// ============================================================
//  ARKAVA PROTOCOL — Web App Logic v3.0
//  Real-Time Market Data · Toast System · Live Ticker
// ============================================================

// ============================================================
// 1. TOAST NOTIFICATION SYSTEM (replaces all alert())
// ============================================================
function showToast(message, type = 'success', duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const svgIcons = {
    success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
    warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  };

  const cfg = {
    success: { icon: svgIcons.success, label: 'Confirmed' },
    info: { icon: svgIcons.info, label: 'Notice' },
    warning: { icon: svgIcons.warning, label: 'Attention' },
    error: { icon: svgIcons.error, label: 'Error' }
  }[type] || { icon: svgIcons.success, label: 'Confirmed' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon-wrap">${cfg.icon}</div>
    <div class="toast-body">
      <div class="toast-label">${cfg.label}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-dismiss" onclick="this.closest('.toast').remove()">✕</button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-in'));
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// ============================================================
// 2. LIVE PRICE FETCHING (Yahoo Finance via allorigins proxy)
// ============================================================
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

// Map aToken symbols → Yahoo Finance ticker symbols
const YAHOO_MAP = {
  aAAPL: 'AAPL',
  aNVDA: 'NVDA',
  aCOIN: 'COIN',
  aTSLA: 'TSLA',
  aMSFT: 'MSFT',
  aCSPX: 'SPY',
  aIB01: 'SHV',
  aHYG: 'HYG',
};

let liveDataAvailable = false;

async function fetchLiveQuote(yahooSymbol) {
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

function updateTickerItem(yahooSymbol, price, changePct) {
  const el = document.getElementById(`tick-${yahooSymbol}`);
  if (!el) return;
  const priceSpan = el.querySelector('.ticker-price-val');
  const chgSpan = el.querySelector('.ticker-chg');
  if (priceSpan) priceSpan.textContent = `$${price.toFixed(2)}`;
  if (chgSpan) {
    const sign = changePct >= 0 ? '+' : '';
    chgSpan.textContent = `${sign}${changePct.toFixed(2)}%`;
    chgSpan.className = `ticker-chg ${changePct >= 0 ? 'positive' : 'negative'}`;
  }
}

async function refreshAllPrices() {
  const statusEl = document.getElementById('ticker-status');
  if (statusEl) { statusEl.textContent = 'Fetching live data...'; statusEl.style.color = 'var(--color-taupe)'; }

  let successCount = 0;

  for (const [arkavaSymbol, yahooSymbol] of Object.entries(YAHOO_MAP)) {
    try {
      const data = await fetchLiveQuote(yahooSymbol);
      if (!data?.price) continue;

      // Update our asset store
      const asset = assets.find(a => a.symbol === arkavaSymbol);
      if (asset) {
        asset.price = data.price;
        asset.liveChangePct = data.changePct;
      }

      // Flash the table cell
      const priceEl = document.getElementById(`price-${arkavaSymbol}`);
      if (priceEl) {
        priceEl.textContent = `$${data.price.toFixed(2)}`;
        priceEl.classList.remove('price-flash-green', 'price-flash-red');
        void priceEl.offsetWidth;
        priceEl.classList.add(data.changePct >= 0 ? 'price-flash-green' : 'price-flash-red');
      }

      // Update live ticker bar
      updateTickerItem(yahooSymbol, data.price, data.changePct);
      successCount++;
    } catch (_e) {
      // API failed — silently fallback; simulation handles the tick
    }
    await new Promise(r => setTimeout(r, 250)); // gentle rate-limit spacing
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

  if (liveDataAvailable) renderAssetTable();
}

// ============================================================
// 3. ANIMATED COUNTER (TVL & Stats)
// ============================================================
function animateCounter(el, target, prefix = '$', suffix = '', duration = 2200) {
  if (!el) return;
  const startTime = performance.now();
  const easeOut = t => 1 - Math.pow(1 - t, 4);
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const v = Math.round(easeOut(t) * target);
    el.textContent = prefix + v.toLocaleString() + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounterAnimations() {
  const tvlEl = document.getElementById('hero-stat-tvl');
  if (!tvlEl) return;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      animateCounter(tvlEl, 148920400, '$', '');
      obs.disconnect();
    }
  }, { threshold: 0.6 });
  obs.observe(tvlEl);
}

// ============================================================
// 4. ASSET REGISTRY DATA
// ============================================================
const assets = [
  {
    symbol: 'aAAPL', name: 'Arkava AAPL Apple Inc',
    underlier: 'Apple Inc. Common Stock', isin: 'US0378331005',
    price: 224.50, yield: '+1.20% DIV', category: 'equity',
    collateral: '100.00%', volume: '$12,490,000',
    iconBg: '#FFFFFF', border: '1px solid #E7E2CF',
    logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#17190F"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.97.99-3.12-1.01.04-2.22.68-2.92 1.5-.63.73-1.18 1.91-1.03 3.04 1.13.09 2.29-.6 2.96-1.42z"/></svg>`
  },
  {
    symbol: 'aNVDA', name: 'Arkava NVDA NVIDIA Corp',
    underlier: 'NVIDIA Corporation Common Stock', isin: 'US67066G1040',
    price: 128.90, yield: '+0.15% DIV', category: 'equity',
    collateral: '100.00%', volume: '$18,210,800',
    iconBg: '#000000', border: '1px solid #76B900',
    logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#76B900"><path d="M12.003 3.654c-4.57 0-8.28 3.708-8.28 8.28 0 4.573 3.71 8.283 8.28 8.283 4.574 0 8.283-3.71 8.283-8.283 0-4.572-3.71-8.28-8.28zm4.186 11.246c-.722.97-1.795 1.543-3.003 1.543-1.954 0-3.542-1.587-3.542-3.54 0-1.956 1.588-3.543 3.542-3.543 1.196 0 2.26.565 2.986 1.52.203.268.583.318.85.115.267-.202.317-.582.115-.85-.947-1.244-2.38-1.985-3.95-1.985-2.614 0-4.743 2.128-4.743 4.743 0 2.614 2.129 4.742 4.743 4.742 1.582 0 3.023-.746 3.97-1.996.2-.266.147-.645-.12-.844-.266-.2-.644-.148-.843.118z"/></svg>`
  },
  {
    symbol: 'aCOIN', name: 'Arkava COIN Coinbase Global',
    underlier: 'Coinbase Global Inc. Class A Stock', isin: 'US19260Q1076',
    price: 218.80, yield: '+3.85% EST', category: 'equity',
    collateral: '100.00%', volume: '$9,980,400',
    iconBg: '#0052FF', border: '1px solid #0052FF',
    logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 13.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg>`
  },
  {
    symbol: 'aTSLA', name: 'Arkava TSLA Tesla Inc',
    underlier: 'Tesla Inc. Common Stock', isin: 'US88160R1014',
    price: 219.80, yield: '+2.40% EST', category: 'equity',
    collateral: '100.00%', volume: '$14,350,000',
    iconBg: '#E82127', border: '1px solid #E82127',
    logoSvg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M12 5.572c2.723 0 5.864.55 8.163 1.954l.837-2.526C18.067 3.58 14.654 3 12 3s-6.067.58-9 2l.837 2.526c2.299-1.404 5.44-1.954 8.163-1.954zM12 9.5c-2.316 0-3.953.486-4.5.75L7 7.5c1.442-.647 3.123-1 5-1s3.558.353 5 1l-.5 2.75c-.547-.264-2.184-.75-4.5-.75zM10.8 11h2.4v10h-2.4V11z"/></svg>`
  },
  {
    symbol: 'aMSFT', name: 'Arkava MSFT Microsoft Corp',
    underlier: 'Microsoft Corporation Stock', isin: 'US5949181045',
    price: 428.50, yield: '+0.75% DIV', category: 'equity',
    collateral: '100.00%', volume: '$11,620,000',
    iconBg: '#FFFFFF', border: '1px solid #E7E2CF',
    logoSvg: `<svg width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="8.5" height="8.5" fill="#F25022"/><rect x="12.5" y="3" width="8.5" height="8.5" fill="#7FBA00"/><rect x="3" y="12.5" width="8.5" height="8.5" fill="#00A4EF"/><rect x="12.5" y="12.5" width="8.5" height="8.5" fill="#FFB900"/></svg>`
  },
  {
    symbol: 'aCSPX', name: 'Arkava CSPX Core S&P 500',
    underlier: 'iShares Core S&P 500 UCITS ETF', isin: 'IE00B5BMR087',
    price: 542.10, yield: '+9.80% EST', category: 'equity',
    collateral: '100.00%', volume: '$8,540,100',
    iconBg: '#17190F', border: '1px solid #17190F',
    logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="#17190F"/><text x="12" y="16" font-family="sans-serif" font-size="11" font-weight="900" fill="#A6B92C" text-anchor="middle">S&P</text></svg>`
  },
  {
    symbol: 'aIB01', name: 'Arkava IB01 Treasury 0-1yr',
    underlier: 'iShares $ Treasury Bond 0-1yr UCITS ETF', isin: 'IE00B1FZS350',
    price: 108.42, yield: '+5.24% APY', category: 'treasury',
    collateral: '100.00%', volume: '$16,820,500',
    iconBg: '#2C3A19', border: '1px solid #2C3A19',
    logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="4" fill="#2C3A19"/><circle cx="12" cy="12" r="5" fill="#FAF8EF"/><text x="12" y="15.5" font-family="sans-serif" font-size="11" font-weight="bold" fill="#2C3A19" text-anchor="middle">$</text></svg>`
  },
  {
    symbol: 'aHYG', name: 'Arkava HYG Corp Bond',
    underlier: 'iShares iBoxx High Yield Corp Bond ETF', isin: 'US4642885135',
    price: 77.30, yield: '+4.85% APY', category: 'corporate',
    collateral: '100.00%', volume: '$4,410,200',
    iconBg: '#71801F', border: '1px solid #71801F',
    logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill="#71801F"/><text x="12" y="15.5" font-family="sans-serif" font-size="10" font-weight="bold" fill="#FAF8EF" text-anchor="middle">HYG</text></svg>`
  }
];

// ============================================================
// 5. MAIN APP LOGIC
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  let currentCategoryFilter = 'all';
  let searchQuery = '';

  // --- Render Explorer Asset Table ---
  const tableBody = document.getElementById('asset-table-body');

  function renderAssetTable() {
    if (!tableBody) return;
    const filtered = assets.filter(asset => {
      const matchCat = currentCategoryFilter === 'all' || asset.category === currentCategoryFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = asset.name.toLowerCase().includes(q) ||
        asset.symbol.toLowerCase().includes(q) ||
        asset.isin.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--color-taupe);">No assets found matching "${searchQuery}".</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(asset => {
      const chg = asset.liveChangePct;
      const chgHtml = chg !== undefined
        ? `<span class="badge ${chg >= 0 ? 'badge-accent' : 'badge-danger'}" style="font-size:11px;">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%</span>`
        : '';
      return `
        <tr id="row-${asset.symbol}">
          <td>
            <div class="asset-cell">
              <div class="asset-icon" style="background-color:${asset.iconBg};border:${asset.border}">${asset.logoSvg}</div>
              <div class="asset-info">
                <span class="asset-name" style="display:flex;align-items:center;gap:6px;">${asset.symbol} ${chgHtml}</span>
                <span class="asset-symbol">${asset.name}</span>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex;flex-direction:column;">
              <span style="font-size:14px;font-weight:600;color:var(--color-navy);">${asset.underlier}</span>
              <span class="mono-small" style="color:var(--color-taupe);">${asset.isin}</span>
            </div>
          </td>
          <td><span class="mono-large asset-price-val" id="price-${asset.symbol}" style="font-size:16px;font-weight:600;padding:2px 6px;border-radius:4px;transition:all 0.4s ease;">$${asset.price.toFixed(2)}</span></td>
          <td><span class="badge ${asset.yield.includes('N/A') ? 'badge-standard' : 'badge-accent'}">${asset.yield}</span></td>
          <td><span class="badge badge-standard">${asset.collateral} Collateralized</span></td>
          <td><span class="mono-small">${asset.volume}</span></td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-primary btn-trade-open" data-symbol="${asset.symbol}" style="font-size:12px;height:32px;min-width:0;padding:0 12px;">Trade</button>
              <button class="btn btn-secondary btn-inspect" data-symbol="${asset.symbol}" style="font-size:12px;height:32px;min-width:0;padding:0 12px;">Details</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    document.querySelectorAll('.btn-inspect').forEach(btn => {
      btn.addEventListener('click', e => openAssetDetailModal(e.currentTarget.dataset.symbol));
    });
    document.querySelectorAll('.btn-trade-open').forEach(btn => {
      btn.addEventListener('click', e => openTradeModal(e.currentTarget.dataset.symbol));
    });
  }

  // --- Asset Details Modal ---
  const modalAssetDetail = document.getElementById('modal-asset-detail');
  const modalAssetClose = document.getElementById('modal-asset-close');
  const modalBtnCloseAction = document.getElementById('modal-btn-close-action');

  function openAssetDetailModal(symbol = 'aAAPL') {
    const asset = assets.find(a => a.symbol === symbol) || assets[0];
    if (!modalAssetDetail) return;
    const nameEl = document.getElementById('modal-asset-name');
    const isinEl = document.getElementById('modal-asset-isin');
    const underlierEl = document.getElementById('modal-asset-underlier');
    const yieldEl = document.getElementById('modal-asset-yield');
    const priceEl = document.getElementById('modal-asset-price');
    const iconEl = document.getElementById('modal-asset-icon');

    if (nameEl) nameEl.textContent = `${asset.symbol} — ${asset.name}`;
    if (isinEl) isinEl.textContent = `ISIN: ${asset.isin}`;
    if (underlierEl) underlierEl.textContent = asset.underlier;
    if (yieldEl) yieldEl.textContent = asset.yield;
    if (priceEl) priceEl.textContent = `$${asset.price.toFixed(2)} USD`;
    if (iconEl) { iconEl.style.backgroundColor = asset.iconBg; iconEl.style.border = asset.border; iconEl.innerHTML = asset.logoSvg; }

    modalAssetDetail.classList.add('open');
  }

  function closeAssetDetailModal() {
    if (modalAssetDetail) modalAssetDetail.classList.remove('open');
  }

  if (modalAssetClose) modalAssetClose.addEventListener('click', closeAssetDetailModal);
  if (modalBtnCloseAction) modalBtnCloseAction.addEventListener('click', closeAssetDetailModal);

  // --- Trade Terminal Modal ---
  const modalTrade = document.getElementById('modal-trade');
  const modalTradeClose = document.getElementById('modal-trade-close');
  const tradeInputUsd = document.getElementById('trade-input-usd');
  const tradeOutputTokens = document.getElementById('trade-output-tokens');
  const btnSubmitOrder = document.getElementById('btn-submit-order');
  let currentTradingSymbol = 'aAAPL';

  // --- Dynamic SVG Chart Renderer & Timeframe Selectors ---
  function drawDynamicChart(svgId, timeframe = '1D') {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    const dataMap = {
      '1D': [20, 25, 22, 28, 35, 30, 42, 38, 45, 48],
      '1W': [15, 18, 24, 22, 30, 28, 36, 40, 44, 52],
      '1M': [30, 28, 35, 32, 40, 45, 42, 50, 58, 65],
      '1Y': [10, 15, 20, 28, 32, 40, 48, 55, 62, 75]
    };
    const points = dataMap[timeframe] || dataMap['1D'];
    const width = 300, height = svgId === 'hero-chart-svg' ? 60 : 100;
    const max = Math.max(...points), min = Math.min(...points);
    const range = max - min || 1;
    const stepX = width / (points.length - 1);
    const coords = points.map((val, idx) => {
      const x = idx * stepX;
      const y = height - ((val - min) / range) * (height - 16) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const pathD = `M ${coords.join(' L ')}`;
    const areaD = `M 0,${height} L ${coords.join(' L ')} L ${width},${height} Z`;
    svg.innerHTML = `
      <defs>
        <linearGradient id="grad-${svgId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#A6B92C" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#A6B92C" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#grad-${svgId})" />
      <path d="${pathD}" fill="none" stroke="#2C3A19" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    `;
  }

  // Draw initial charts
  drawDynamicChart('hero-chart-svg', '1D');
  drawDynamicChart('modal-chart-svg', '1D');

  // Timeframe selector button handlers
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const parent = e.target.closest('.timeframe-group');
      if (parent) parent.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const tf = e.target.dataset.tf;
      if (parent?.classList.contains('hero-timeframe-group')) {
        drawDynamicChart('hero-chart-svg', tf);
      } else {
        drawDynamicChart('modal-chart-svg', tf);
      }
    });
  });

  let tradeMode = 'buy';
  const tradeTabBuy = document.getElementById('trade-tab-buy');
  const tradeTabSell = document.getElementById('trade-tab-sell');
  const tradeInputLabel = document.getElementById('trade-input-label');
  const tradeInputBadge = document.getElementById('trade-input-badge');
  const tradeOutputLabel = document.getElementById('trade-output-label');

  if (tradeTabBuy && tradeTabSell) {
    tradeTabBuy.addEventListener('click', () => {
      tradeMode = 'buy';
      tradeTabBuy.className = 'btn btn-primary';
      tradeTabSell.className = 'btn btn-secondary';
      if (tradeInputLabel) tradeInputLabel.textContent = 'Pay USD Amount';
      if (tradeInputBadge) tradeInputBadge.textContent = 'USD';
      if (tradeOutputLabel) tradeOutputLabel.textContent = 'You Receive';
      if (btnSubmitOrder) btnSubmitOrder.textContent = 'Execute Buy Order';
      if (tradeInputUsd && (tradeInputUsd.value === '5' || !tradeInputUsd.value)) tradeInputUsd.value = '1000';
      updateTradeModalMath();
    });

    tradeTabSell.addEventListener('click', () => {
      tradeMode = 'sell';
      tradeTabSell.className = 'btn btn-primary';
      tradeTabBuy.className = 'btn btn-secondary';
      if (tradeInputLabel) tradeInputLabel.textContent = 'Sell Token Amount';
      if (tradeInputBadge) tradeInputBadge.textContent = currentTradingSymbol;
      if (tradeOutputLabel) tradeOutputLabel.textContent = 'Estimated USD Payout';
      if (btnSubmitOrder) btnSubmitOrder.textContent = 'Execute Sell Order';
      if (tradeInputUsd && (tradeInputUsd.value === '1000' || !tradeInputUsd.value)) tradeInputUsd.value = '5';
      updateTradeModalMath();
    });
  }

  function openTradeModal(symbol = 'aAAPL') {
    const asset = assets.find(a => a.symbol === symbol) || assets[0];
    currentTradingSymbol = asset.symbol;
    if (!modalTrade) return;

    // Always reset to Buy mode on open
    tradeMode = 'buy';
    if (tradeTabBuy) tradeTabBuy.className = 'btn btn-primary';
    if (tradeTabSell) tradeTabSell.className = 'btn btn-secondary';
    if (tradeInputLabel) tradeInputLabel.textContent = 'Pay USD Amount';
    if (tradeInputBadge) tradeInputBadge.textContent = 'USD';
    if (tradeOutputLabel) tradeOutputLabel.textContent = 'You Receive';
    if (btnSubmitOrder) btnSubmitOrder.textContent = 'Execute Buy Order';
    if (tradeInputUsd) tradeInputUsd.value = '1000';

    document.getElementById('trade-modal-title').textContent = `${asset.symbol} — ${asset.underlier}`;
    document.getElementById('trade-modal-subtitle').textContent = `ISIN: ${asset.isin} • 100% Swiss Custody`;
    document.getElementById('trade-modal-price').textContent = `$${asset.price.toFixed(2)} USD`;
    const changeBadge = document.getElementById('trade-modal-change-badge');
    if (changeBadge) {
      const pct = asset.liveChangePct !== undefined ? asset.liveChangePct : 1.20;
      const sign = pct >= 0 ? '+' : '';
      changeBadge.textContent = `${sign}${pct.toFixed(2)}% 24h`;
      changeBadge.className = pct >= 0 ? 'badge badge-accent' : 'badge badge-danger';
    }
    const tradeIcon = document.getElementById('trade-modal-icon');
    if (tradeIcon) { tradeIcon.style.backgroundColor = asset.iconBg; tradeIcon.style.border = asset.border; tradeIcon.innerHTML = asset.logoSvg; }

    // Sync import button symbol
    const importBtn = document.getElementById('btn-import-trade-token');
    if (importBtn) importBtn.dataset.symbol = asset.symbol;

    drawDynamicChart('modal-chart-svg', '1D');
    updateTradeModalMath();
    modalTrade.classList.add('open');
  }

  function closeTradeModal() { if (modalTrade) modalTrade.classList.remove('open'); }

  function updateTradeModalMath() {
    if (!tradeInputUsd || !tradeOutputTokens) return;
    const val = parseFloat(tradeInputUsd.value) || 0;
    const asset = assets.find(a => a.symbol === currentTradingSymbol) || assets[0];

    if (tradeMode === 'buy') {
      const count = (val / asset.price).toFixed(4);
      tradeOutputTokens.value = `${count} ${asset.symbol}`;
    } else {
      const usdTotal = (val * asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      tradeOutputTokens.value = `$${usdTotal} USD`;
    }
  }

  if (tradeInputUsd) tradeInputUsd.addEventListener('input', updateTradeModalMath);
  if (modalTradeClose) modalTradeClose.addEventListener('click', closeTradeModal);

  if (btnSubmitOrder) {
    btnSubmitOrder.addEventListener('click', () => {
      if (!requireWalletConnection('executing trade orders')) return;
      const val = parseFloat(tradeInputUsd.value) || 0;
      const asset = assets.find(a => a.symbol === currentTradingSymbol) || assets[0];
      if (val <= 0) { showToast('Please enter a valid amount.', 'warning'); return; }

      if (tradeMode === 'buy') {
        // BUY: user pays USD, receives tokens
        const sharesBought = val / asset.price;
        if (val > userPortfolio.cashUsd) {
          showToast('Insufficient tUSDC balance. Claim more from the Testnet Faucet.', 'warning');
          return;
        }
        let existing = userPortfolio.holdings.find(h => h.symbol === asset.symbol);
        if (existing) {
          existing.shares += sharesBought;
        } else {
          userPortfolio.holdings.push({ symbol: asset.symbol, shares: sharesBought, buyPrice: asset.price });
        }
        userPortfolio.cashUsd = Math.max(0, userPortfolio.cashUsd - val);
      } else {
        // SELL: user burns token amount (val = token qty), receives USD
        const tokenQty = val;
        const usdReceived = tokenQty * asset.price;
        let existing = userPortfolio.holdings.find(h => h.symbol === asset.symbol);
        if (!existing || existing.shares < tokenQty) {
          showToast(`Insufficient ${asset.symbol} token balance to sell.`, 'warning');
          return;
        }
        existing.shares = Math.max(0, existing.shares - tokenQty);
        userPortfolio.cashUsd += usdReceived;
      }

      updatePortfolioUI();

      const simTxHash = '0xSIM' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('') + '...';
      const action = tradeMode === 'buy' ? 'Simulated Buy' : 'Simulated Sell';
      showToast(
        `Sandbox Demo — ${action}: <strong>${tradeOutputTokens.value}</strong><br><small style="opacity:0.85">Simulated Tx: ${simTxHash} • Robinhood Testnet (Chain 5050) • Swissquote Custody Reserved • Mainnet launches Q3 2026</small>`,
        'success', 9000
      );
      closeTradeModal();
    });
  }

  // Render initial asset table
  renderAssetTable();

  // Hero & Widget Trade Triggers
  const heroBtnTrade = document.getElementById('hero-btn-trade-trigger');
  const widgetBtnMint = document.getElementById('widget-btn-mint');
  const widgetBtnDetails = document.getElementById('widget-btn-details');

  if (heroBtnTrade) heroBtnTrade.addEventListener('click', () => openTradeModal('aAAPL'));
  if (widgetBtnMint) widgetBtnMint.addEventListener('click', () => openTradeModal('aAAPL'));
  if (widgetBtnDetails) widgetBtnDetails.addEventListener('click', () => openAssetDetailModal('aAAPL'));

  const modalBtnOpenTerminal = document.getElementById('modal-btn-open-terminal');
  if (modalBtnOpenTerminal) modalBtnOpenTerminal.addEventListener('click', () => { closeAssetDetailModal(); openTradeModal(currentTradingSymbol); });

  // --- Simulated Price Tick (fallback / supplement) ---
  setInterval(() => {
    const randomIndex = Math.floor(Math.random() * assets.length);
    const targetAsset = assets[randomIndex];
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
    updateSimulatorMath();
    updateTradeModalMath();
  }, 2500);

  // --- Scroll Reveal Animations ---
  document.querySelectorAll('section').forEach(s => s.classList.add('reveal-on-scroll'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal-on-scroll').forEach(s => observer.observe(s));

  // --- Category Filter Tabs ---
  document.querySelectorAll('#explorer-tabs .tab-btn').forEach(tab => {
    tab.addEventListener('click', e => {
      document.querySelectorAll('#explorer-tabs .tab-btn').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentCategoryFilter = e.target.dataset.category;
      renderAssetTable();
    });
  });

  // --- Search Bar ---
  const searchInput = document.getElementById('asset-search-input');
  if (searchInput) searchInput.addEventListener('input', e => { searchQuery = e.target.value; renderAssetTable(); });

  // --- Mint / Redeem Simulator Mode Toggle & Engine ---
  let simMode = 'mint';
  const simTabMint = document.getElementById('sim-tab-mint');
  const simTabRedeem = document.getElementById('sim-tab-redeem');
  const simStep1Title = document.getElementById('sim-step1-title');
  const simStep1Label = document.getElementById('sim-step1-label');
  const simStep2Title = document.getElementById('sim-step2-title');
  const simStep2Label = document.getElementById('sim-step2-label');
  const simSummaryTitle = document.getElementById('sim-summary-title');
  const simFeeLabel = document.getElementById('sim-fee-label');
  const simNetLabel = document.getElementById('sim-net-label');
  const simInputAmount = document.getElementById('sim-input-amount');
  const simInputCurrency = document.getElementById('sim-input-currency');
  const simOutputAmount = document.getElementById('sim-output-amount');
  const simOutputCurrency = document.getElementById('sim-output-currency');
  const simUnderlyingPrice = document.getElementById('sim-underlying-price');
  const simNetAmount = document.getElementById('sim-net-amount');
  const btnExecuteSim = document.getElementById('btn-execute-sim');

  const fiatOptionsHtml = `
    <option value="USD">USD</option>
    <option value="USDC">USDC</option>
    <option value="USDT">USDT</option>
  `;

  const tokenOptionsHtml = `
    <option value="aAAPL">aAAPL (Apple)</option>
    <option value="aNVDA">aNVDA (NVIDIA)</option>
    <option value="aCOIN">aCOIN (Coinbase)</option>
    <option value="aTSLA">aTSLA (Tesla)</option>
    <option value="aMSFT">aMSFT (Microsoft)</option>
    <option value="aCSPX">aCSPX (S&P 500)</option>
    <option value="aIB01">aIB01 (Treasuries)</option>
  `;

  function updateSimulatorMath() {
    if (!simInputAmount || !simInputCurrency || !simOutputCurrency) return;
    const val = parseFloat(simInputAmount.value) || 0;

    if (simMode === 'mint') {
      const selectedToken = simOutputCurrency.value || 'aAAPL';
      const selectedFiat = simInputCurrency.value || 'USD';
      const target = assets.find(a => a.symbol === selectedToken) || assets[0];
      const count = (val / target.price).toFixed(4);
      if (simOutputAmount) simOutputAmount.value = `${count} ${target.symbol}`;
      if (simUnderlyingPrice) simUnderlyingPrice.textContent = `$${target.price.toFixed(2)} USD`;
      if (simNetAmount) simNetAmount.textContent = `${count} ${target.symbol}`;
    } else {
      // Redeem mode: input currency is token (aAAPL, etc), output currency is Fiat (USD, USDC)
      const selectedToken = simInputCurrency.value || 'aAAPL';
      const selectedFiat = simOutputCurrency.value || 'USD';
      const target = assets.find(a => a.symbol === selectedToken) || assets[0];
      const fiatTotal = (val * target.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (simOutputAmount) simOutputAmount.value = `$${fiatTotal} ${selectedFiat}`;
      if (simUnderlyingPrice) simUnderlyingPrice.textContent = `$${target.price.toFixed(2)} USD`;
      if (simNetAmount) simNetAmount.textContent = `$${fiatTotal} ${selectedFiat}`;
    }
  }

  if (simTabMint && simTabRedeem) {
    simTabMint.addEventListener('click', () => {
      simMode = 'mint';
      simTabMint.classList.add('active');
      simTabRedeem.classList.remove('active');

      if (simStep1Title) simStep1Title.textContent = '1. Deposit Collateral';
      if (simStep1Label) simStep1Label.textContent = 'You Deposit';
      if (simStep2Title) simStep2Title.textContent = '2. Receive Token';
      if (simStep2Label) simStep2Label.textContent = 'Estimated Receive';
      if (simSummaryTitle) simSummaryTitle.textContent = 'Mint Order Summary';
      if (simFeeLabel) simFeeLabel.textContent = 'Mint Fee (0.00% Launch)';
      if (simNetLabel) simNetLabel.textContent = 'Net Token Amount';
      if (btnExecuteSim) btnExecuteSim.textContent = 'Simulate Mint Transaction';

      if (simInputCurrency) simInputCurrency.innerHTML = fiatOptionsHtml;
      if (simOutputCurrency) simOutputCurrency.innerHTML = tokenOptionsHtml;
      if (simInputAmount && (simInputAmount.value === '50' || !simInputAmount.value)) simInputAmount.value = '10000';
      updateSimulatorMath();
    });

    simTabRedeem.addEventListener('click', () => {
      simMode = 'redeem';
      simTabRedeem.classList.add('active');
      simTabMint.classList.remove('active');

      if (simStep1Title) simStep1Title.textContent = '1. Burn aToken Asset';
      if (simStep1Label) simStep1Label.textContent = 'You Burn Token';
      if (simStep2Title) simStep2Title.textContent = '2. Receive Fiat / Cash';
      if (simStep2Label) simStep2Label.textContent = 'Estimated Fiat Payout';
      if (simSummaryTitle) simSummaryTitle.textContent = 'Redemption Order Summary';
      if (simFeeLabel) simFeeLabel.textContent = 'Redeem Fee (0.00% Launch)';
      if (simNetLabel) simNetLabel.textContent = 'Net USD Payout';
      if (btnExecuteSim) btnExecuteSim.textContent = 'Simulate Token Redemption';

      if (simInputCurrency) simInputCurrency.innerHTML = tokenOptionsHtml;
      if (simOutputCurrency) simOutputCurrency.innerHTML = fiatOptionsHtml;
      if (simInputAmount && (simInputAmount.value === '10000' || !simInputAmount.value)) simInputAmount.value = '50';
      updateSimulatorMath();
    });
  }

  if (simInputAmount) simInputAmount.addEventListener('input', updateSimulatorMath);
  if (simInputCurrency) simInputCurrency.addEventListener('change', updateSimulatorMath);
  if (simOutputCurrency) simOutputCurrency.addEventListener('change', updateSimulatorMath);

  if (btnExecuteSim) {
    btnExecuteSim.addEventListener('click', () => {
      if (!requireWalletConnection('executing mint or redeem simulations')) return;
      if (simMode === 'mint') {
        // MINT: user pays USD/USDC, receives aTokens — deduct cash
        const payCurrency = simInputCurrency?.value || 'USD';
        const val = parseFloat(simInputAmount?.value) || 1000;
        if (val > userPortfolio.cashUsd) {
          showToast('Insufficient tUSDC balance. Claim more from the Testnet Faucet.', 'warning');
          return;
        }
        userPortfolio.cashUsd = Math.max(0, userPortfolio.cashUsd - val);
        updatePortfolioUI();
        showToast(
          `Mint simulation: <strong>${simOutputAmount?.value}</strong> for $${simInputAmount?.value} ${payCurrency}. Collateral verified 1:1 in Swissquote custody.`,
          'success', 6000
        );
      } else {
        // REDEEM: user burns aTokens, receives USD — add cash
        const burnToken = simInputCurrency?.value || 'aAAPL';
        const simVal = parseFloat(simInputAmount?.value) || 0;
        const redeemAsset = assets.find(a => a.symbol === burnToken) || assets[0];
        userPortfolio.cashUsd += simVal * redeemAsset.price;
        updatePortfolioUI();
        showToast(
          `Redemption simulation: Burned <strong>${simInputAmount?.value} ${burnToken}</strong>. Payout of <strong>${simOutputAmount?.value}</strong> wired from Swissquote Bank to your wallet.`,
          'success', 7000
        );
      }
    });
  }

  // --- Yield Calculator ---
  const calcPrincipalSlider = document.getElementById('calc-principal-slider');
  const calcPrincipalDisplay = document.getElementById('calc-principal-display');
  const calcYearsSlider = document.getElementById('calc-years-slider');
  const calcYearsDisplay = document.getElementById('calc-years-display');
  const calcAssetSelect = document.getElementById('calc-asset-select');
  const calcTotalResult = document.getElementById('calc-total-result');
  const calcYieldEarned = document.getElementById('calc-yield-earned');
  const calcBankResult = document.getElementById('calc-bank-result');
  const calcOutperformance = document.getElementById('calc-outperformance');

  function updateCalculatorMath() {
    if (!calcPrincipalSlider || !calcYearsSlider || !calcAssetSelect) return;
    const principal = parseFloat(calcPrincipalSlider.value);
    const years = parseFloat(calcYearsSlider.value);
    const rate = parseFloat(calcAssetSelect.value);
    if (calcPrincipalDisplay) calcPrincipalDisplay.textContent = `$${principal.toLocaleString()}`;
    if (calcYearsDisplay) calcYearsDisplay.textContent = `${years} Year${years > 1 ? 's' : ''}`;
    const futureValue = principal * Math.pow(1 + rate, years);
    const yieldEarned = futureValue - principal;
    const bankFuture = principal * Math.pow(1.001, years);
    const outperform = futureValue - bankFuture;
    if (calcTotalResult) calcTotalResult.textContent = `$${Math.round(futureValue).toLocaleString()} USD`;
    if (calcYieldEarned) calcYieldEarned.textContent = `+$${Math.round(yieldEarned).toLocaleString()} USD`;
    if (calcBankResult) calcBankResult.textContent = `$${Math.round(bankFuture).toLocaleString()} USD`;
    if (calcOutperformance) calcOutperformance.textContent = `+$${Math.round(outperform).toLocaleString()} USD`;
  }

  if (calcPrincipalSlider) calcPrincipalSlider.addEventListener('input', updateCalculatorMath);
  if (calcYearsSlider) calcYearsSlider.addEventListener('input', updateCalculatorMath);
  if (calcAssetSelect) calcAssetSelect.addEventListener('change', updateCalculatorMath);
  updateCalculatorMath();

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', e => e.currentTarget.closest('.faq-item').classList.toggle('open'));
  });

  // --- Web3 Wallet & Portfolio State Engine ---
  let isWalletConnected = false;
  let userWalletAddress = null;
  let activeWalletName = null;

  const userPortfolio = {
    cashUsd: 14200.00,
    holdings: [
      { symbol: 'aAAPL', shares: 20.0, buyPrice: 224.50 },
      { symbol: 'aNVDA', shares: 30.0, buyPrice: 128.90 },
      { symbol: 'aCSPX', shares: 10.0, buyPrice: 542.10 }
    ]
  };

  function requireWalletConnection(actionName = 'perform this action') {
    if (!isWalletConnected) {
      showToast(`Please connect your Web3 wallet before ${actionName}.`, 'warning');
      if (modalWallet) modalWallet.classList.add('open');
      return false;
    }
    return true;
  }

  function updatePortfolioUI() {
    // Only update UI if user has actually connected a wallet
    if (!isWalletConnected) return;

    let holdingsValueUsd = 0;
    userPortfolio.holdings.forEach(h => {
      const asset = assets.find(a => a.symbol === h.symbol) || { price: h.buyPrice };
      holdingsValueUsd += h.shares * asset.price;
    });

    const totalVal = userPortfolio.cashUsd + holdingsValueUsd;
    const formattedTotal = totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const portTotalValEl = document.getElementById('port-total-val');
    if (portTotalValEl) portTotalValEl.textContent = `$${formattedTotal}`;

    const btnOpenPortSpan = document.querySelector('#btn-open-portfolio span');
    if (btnOpenPortSpan) {
      const formattedK = (totalVal / 1000).toFixed(1);
      btnOpenPortSpan.textContent = `Portfolio ($${formattedK}k)`;
    }
  }

  // --- Wallet Modal ---
  const modalWallet = document.getElementById('modal-wallet');
  const btnConnectWallet = document.getElementById('btn-connect-wallet');
  const btnConnectMobile = document.getElementById('btn-connect-wallet-mobile');
  const modalWalletClose = document.getElementById('modal-wallet-close');
  const openWalletModal = () => { if (modalWallet) modalWallet.classList.add('open'); };
  const closeWalletModal = () => { if (modalWallet) modalWallet.classList.remove('open'); };
  if (btnConnectWallet) btnConnectWallet.addEventListener('click', openWalletModal);
  if (btnConnectMobile) btnConnectMobile.addEventListener('click', openWalletModal);
  if (modalWalletClose) modalWalletClose.addEventListener('click', closeWalletModal);

  // --- Portfolio, Dividends & Telemetry Modals ---
  const modalPortfolio = document.getElementById('modal-portfolio');
  const modalDividends = document.getElementById('modal-dividends');
  const modalOracleTelemetry = document.getElementById('modal-oracle-telemetry');

  const btnOpenPortfolio = document.getElementById('btn-open-portfolio');
  const btnPortfolioTrade = document.getElementById('btn-portfolio-trade');
  const btnPortfolioDivs = document.getElementById('btn-portfolio-dividends');

  if (btnOpenPortfolio) btnOpenPortfolio.addEventListener('click', () => { if (modalPortfolio) modalPortfolio.classList.add('open'); });
  if (btnPortfolioTrade) btnPortfolioTrade.addEventListener('click', () => { if (modalPortfolio) modalPortfolio.classList.remove('open'); openTradeModal('aAAPL'); });
  if (btnPortfolioDivs) btnPortfolioDivs.addEventListener('click', () => { if (modalPortfolio) modalPortfolio.classList.remove('open'); if (modalDividends) modalDividends.classList.add('open'); });

  // Universal Wallet connection state handler
  document.querySelectorAll('.wallet-option-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const walletName = e.currentTarget.dataset.wallet || 'MetaMask';
      isWalletConnected = true;
      activeWalletName = walletName;
      userWalletAddress = '0x71C86a2D...49b2';
      if (btnConnectWallet) {
        btnConnectWallet.innerHTML = `<span>0x71C...49b2</span>`;
        btnConnectWallet.style.backgroundColor = 'var(--color-dark-sage)';
      }
      if (btnOpenPortfolio) btnOpenPortfolio.style.display = 'inline-flex';
      closeWalletModal();
      // Reveal in-modal faucet section for next time modal is opened
      const walletFaucetSection = document.getElementById('wallet-modal-faucet-section');
      if (walletFaucetSection) walletFaucetSection.style.display = 'block';
      showToast(`Connected to <strong>${walletName}</strong>. Account: ${userWalletAddress}`, 'success');
      updatePortfolioUI();
    });
  });

  // Footer / Hero oracle links
  const btnViewOracleData = document.getElementById('btn-view-oracle-data');
  if (btnViewOracleData) btnViewOracleData.addEventListener('click', () => { if (modalOracleTelemetry) modalOracleTelemetry.classList.add('open'); });

  // --- Multi-Chain Selector Handler ---
  const networkChainSelect = document.getElementById('network-chain-select');
  if (networkChainSelect) {
    networkChainSelect.addEventListener('change', e => {
      const names = {
        robinhood: 'Robinhood Chain (L2) • Zero Gas',
        ethereum: 'Ethereum Mainnet • Settlement Layer',
        arbitrum: 'Arbitrum One • L2 Rollup',
        base: 'Base (Coinbase L2) • L2 Rollup'
      };
      const name = names[e.target.value] || 'Robinhood Chain (L2)';
      showToast(`Switched active execution layer to <strong>${name}</strong>.`, 'info');
    });
  }

  // --- Institutional Liquidity Stream Generator Engine ---
  const streamFeedList = document.getElementById('stream-feed-list');
  const streamTotalVolume = document.getElementById('stream-total-volume');
  let currentStreamVolume = 42180500;

  const mockStreamEvents = [
    { type: 'mint', badge: 'MM NODE #02', text: 'Minted <strong>180.0000 aAAPL</strong> ($40,410.00 USD)', chain: 'Robinhood L2' },
    { type: 'redeem', badge: 'AP DESK #04', text: 'Redeemed <strong>100.0000 aNVDA</strong> ($12,890.00 USD)', chain: 'Swissquote Bank' },
    { type: 'mint', badge: 'VAULT POOL', text: 'Auto-compounded <strong>$15,000 USD</strong> in aIB01 Yield Vault', chain: 'Arbitrum One' },
    { type: 'mint', badge: 'MM NODE #07', text: 'Minted <strong>50.0000 aTSLA</strong> ($10,990.00 USD)', chain: 'Robinhood L2' },
    { type: 'redeem', badge: 'AP DESK #02', text: 'Redeemed <strong>25.0000 aMSFT</strong> ($10,712.50 USD)', chain: 'Swissquote Bank' }
  ];

  setInterval(() => {
    if (!streamFeedList) return;
    const evt = mockStreamEvents[Math.floor(Math.random() * mockStreamEvents.length)];
    const deltaVol = Math.floor(Math.random() * 15000) + 5000;
    currentStreamVolume += deltaVol;
    if (streamTotalVolume) streamTotalVolume.textContent = `$${currentStreamVolume.toLocaleString()} USD`;

    const item = document.createElement('div');
    item.className = 'stream-item';
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="badge ${evt.type === 'mint' ? 'badge-accent' : 'badge-warning'}" style="font-size: 10px;">${evt.badge}</span>
        <span>${evt.text}</span>
      </div>
      <span class="mono-small" style="color: #A3A693;">${evt.chain} • 1s ago</span>
    `;

    streamFeedList.insertBefore(item, streamFeedList.firstChild);
    if (streamFeedList.children.length > 5) {
      streamFeedList.removeChild(streamFeedList.lastChild);
    }
  }, 8000);

  // --- Yield Vault Deposit Handlers (with Wallet Protection) ---
  document.querySelectorAll('.btn-vault-deposit').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!requireWalletConnection('depositing into Yield Vaults')) return;
      const vaultName = e.currentTarget.dataset.vault;
      showToast(`Opening deposit for <strong>${vaultName}</strong>. Yield compounding active.`, 'success');
      openTradeModal('aAAPL');
    });
  });

  // --- EIP-747 Token Import Function (Universal Web3 Provider Support) ---
  async function importTokenToWallet(symbol = 'aAAPL') {
    const asset = assets.find(a => a.symbol === symbol) || assets[0];
    const contractMap = {
      aAAPL: '0x3918a9Bf3900a892b11295A6E8203c988942b012',
      aNVDA: '0x78a0A7569e2c6081e7d825c9388B9761e0b5103c',
      aCOIN: '0x19260Q10769a74073581729013098520x43a88b1e',
      aTSLA: '0x88160R10149a74073581729013098520x9923a100',
      aMSFT: '0x59491810459a74073581729013098520x11bb2001',
      aCSPX: '0x00B5BMR0879a74073581729013098520x33cc4002',
      aIB01: '0x00B1FZS3509a74073581729013098520x55dd6003'
    };

    const tokenAddress = contractMap[asset.symbol] || '0x3918a9Bf3900a892b11295A6E8203c988942b012';
    const provider = window.ethereum || window.coinbaseWalletExtension || window.okxwallet || window.rabby;

    if (provider && typeof provider.request === 'function') {
      try {
        const wasAdded = await provider.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: asset.symbol,
              decimals: 18,
              image: `https://raw.githubusercontent.com/arkava-protocol/assets/main/logos/${asset.symbol}.png`
            }
          }
        });
        if (wasAdded) {
          showToast(`Successfully added <strong>${asset.symbol}</strong> (${asset.name}) to your Web3 wallet!`, 'success');
        } else {
          showToast(`Token import request for <strong>${asset.symbol}</strong> was cancelled.`, 'info');
        }
      } catch (error) {
        showToast(`Importing <strong>${asset.symbol}</strong> (Address: ${tokenAddress.slice(0, 10)}...). Registered on Robinhood Chain L2.`, 'success');
      }
    } else {
      showToast(`Import Request: <strong>${asset.symbol}</strong> token contract registered at <code>${tokenAddress.slice(0, 14)}...</code> on Robinhood Chain.`, 'info', 7000);
    }
  }

  // Global listener for EIP-747 token import buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-import-token');
    if (btn) {
      const sym = btn.dataset.symbol || currentTradingSymbol || 'aAAPL';
      importTokenToWallet(sym);
    }
  });

  // --- Attestation Certificate Modal ---
  const modalAttestation = document.getElementById('modal-attestation');
  const btnOpenAttestation = document.getElementById('btn-open-attestation');
  const btnCloseAttestation = document.getElementById('btn-close-attestation');
  const modalAttestClose = document.getElementById('modal-attestation-close');
  const btnDownloadAttestPdf = document.getElementById('btn-download-attestation-pdf');

  if (btnOpenAttestation) btnOpenAttestation.addEventListener('click', () => { if (modalAttestation) modalAttestation.classList.add('open'); });
  if (btnCloseAttestation) btnCloseAttestation.addEventListener('click', () => { if (modalAttestation) modalAttestation.classList.remove('open'); });
  if (modalAttestClose) modalAttestClose.addEventListener('click', () => { if (modalAttestation) modalAttestation.classList.remove('open'); });

  // btn-download-audit (Proof of Reserves section) also opens attestation modal
  const btnDownloadAudit = document.getElementById('btn-download-audit');
  if (btnDownloadAudit) {
    btnDownloadAudit.addEventListener('click', () => {
      showToast('Downloading <strong>ARKAVA_Certificate_AVA.pdf</strong>... Verified FINMA & Security Audit Certificate.', 'success');
      if (modalAttestation) modalAttestation.classList.add('open');
    });
  }

  if (btnDownloadAttestPdf) {
    btnDownloadAttestPdf.addEventListener('click', () => {
      showToast('Downloading <strong>ARKAVA_Certificate_AVA.pdf</strong>... Verified cryptographic signature.', 'success');
    });
  }

  // --- All Protocol Modals ---
  const modalTokenomics = document.getElementById('modal-tokenomics');
  const modalProspectus = document.getElementById('modal-prospectus');
  const modalAudit = document.getElementById('modal-audit');
  const modalDocs = document.getElementById('modal-docs');
  const modalContracts = document.getElementById('modal-contracts');
  const modalGithub = document.getElementById('modal-github');
  const modalChains = document.getElementById('modal-chains');
  const modalInsurance = document.getElementById('modal-insurance');
  const modalFees = document.getElementById('modal-fees');

  const btnOpenInsurance = document.getElementById('btn-open-insurance');
  const btnOpenInsurancePor = document.getElementById('btn-open-insurance-por');
  const btnOpenFees = document.getElementById('btn-open-fee-schedule');
  const btnOpenFeesPor = document.getElementById('btn-open-fees-por');
  const btnFooterInsurance = document.getElementById('footer-link-insurance');
  const btnFooterFees = document.getElementById('footer-link-fees');
  const btnFooterAudit = document.getElementById('footer-link-audit');
  const btnFooterTokenomics = document.getElementById('footer-link-tokenomics');
  const btnFooterProspectus = document.getElementById('footer-link-prospectus');
  const btnFooterContracts = document.getElementById('footer-link-contracts');
  const btnFooterGithub = document.getElementById('footer-link-github');
  const btnFooterChains = document.getElementById('footer-link-chains');
  const btnClaimFaucetNav = document.getElementById('btn-claim-faucet-nav');

  // Helper: Claim faucet funds (shared between nav btn and in-modal btn)
  function claimTestnetFaucet() {
    if (!requireWalletConnection('claiming testnet faucet funds')) return;
    userPortfolio.cashUsd += 10000;
    updatePortfolioUI();
    showToast(
      `<strong>Testnet Faucet Claimed:</strong> 10,000 tUSDC credited to account <code>${userWalletAddress}</code>.<br><small style="opacity:0.85">Robinhood Testnet (Chain 5050) &bull; Test minting &amp; trading aAAPL, aNVDA &amp; aTSLA now active.</small>`,
      'success', 8000
    );
  }

  if (btnClaimFaucetNav) btnClaimFaucetNav.addEventListener('click', claimTestnetFaucet);

  // Faucet button inside the wallet modal (only visible after wallet connected)
  const btnWalletFaucet = document.getElementById('btn-wallet-faucet');
  if (btnWalletFaucet) btnWalletFaucet.addEventListener('click', claimTestnetFaucet);

  if (btnOpenInsurance) btnOpenInsurance.addEventListener('click', () => { if (modalInsurance) modalInsurance.classList.add('open'); });
  if (btnOpenInsurancePor) btnOpenInsurancePor.addEventListener('click', () => { if (modalInsurance) modalInsurance.classList.add('open'); });
  if (btnFooterInsurance) btnFooterInsurance.addEventListener('click', (e) => { e.preventDefault(); if (modalInsurance) modalInsurance.classList.add('open'); });
  if (btnOpenFees) btnOpenFees.addEventListener('click', () => { if (modalFees) modalFees.classList.add('open'); });
  if (btnOpenFeesPor) btnOpenFeesPor.addEventListener('click', () => { if (modalFees) modalFees.classList.add('open'); });
  if (btnFooterFees) btnFooterFees.addEventListener('click', (e) => { e.preventDefault(); if (modalFees) modalFees.classList.add('open'); });
  if (btnFooterAudit) btnFooterAudit.addEventListener('click', (e) => { e.preventDefault(); if (modalAttestation) modalAttestation.classList.add('open'); });

  if (btnFooterTokenomics) btnFooterTokenomics.addEventListener('click', (e) => { e.preventDefault(); if (modalTokenomics) modalTokenomics.classList.add('open'); });
  if (btnFooterProspectus) btnFooterProspectus.addEventListener('click', (e) => { e.preventDefault(); if (modalProspectus) modalProspectus.classList.add('open'); });
  if (btnFooterContracts) btnFooterContracts.addEventListener('click', (e) => { e.preventDefault(); if (modalContracts) modalContracts.classList.add('open'); });
  if (btnFooterGithub) btnFooterGithub.addEventListener('click', (e) => { e.preventDefault(); if (modalGithub) modalGithub.classList.add('open'); });
  if (btnFooterChains) btnFooterChains.addEventListener('click', (e) => { e.preventDefault(); if (modalChains) modalChains.classList.add('open'); });

  // Social link click handlers (X and GitHub open real URLs via href, others show toast)
  const socialHandlers = {
    'social-telegram': 'Telegram channel coming soon — stay tuned!'
  };
  Object.entries(socialHandlers).forEach(([id, msg]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', e => {
        e.preventDefault();
        showToast(msg, 'info');
      });
    }
  });
  // GitHub opens real GitHub repo directly (href already set in HTML)
  const socialGithub = document.getElementById('social-github');
  if (socialGithub) {
    socialGithub.addEventListener('click', e => {
      // Allow default href to open GitHub in new tab
      // No modal needed
    });
  }

  // Close maps
  const closeMap = {
    'modal-tokenomics-close': modalTokenomics, 'btn-close-tokenomics': modalTokenomics,
    'modal-prospectus-close': modalProspectus, 'btn-close-prospectus': modalProspectus,
    'modal-audit-close': modalAudit, 'btn-close-audit': modalAudit,
    'modal-docs-close': modalDocs, 'btn-close-docs': modalDocs,
    'modal-contracts-close': modalContracts, 'btn-close-contracts': modalContracts,
    'modal-github-close': modalGithub, 'btn-close-github': modalGithub,
    'modal-chains-close': modalChains, 'btn-close-chains': modalChains,
    'modal-portfolio-close': modalPortfolio,
    'modal-dividends-close': modalDividends, 'btn-close-dividends': modalDividends,
    'modal-telemetry-close': modalOracleTelemetry, 'btn-close-telemetry': modalOracleTelemetry,
    'modal-attestation-close': modalAttestation, 'btn-close-attestation': modalAttestation,
    'modal-insurance-close': modalInsurance, 'btn-close-insurance': modalInsurance,
    'modal-fees-close': modalFees, 'btn-close-fees': modalFees
  };
  Object.entries(closeMap).forEach(([id, modal]) => {
    const el = document.getElementById(id);
    if (el && modal) el.addEventListener('click', () => modal.classList.remove('open'));
  });

  // Close on backdrop click
  window.addEventListener('click', e => {
    if (e.target === modalTrade) closeTradeModal();
    if (e.target === modalWallet) closeWalletModal();
    if (e.target === modalAssetDetail) closeAssetDetailModal();
    [modalTokenomics, modalProspectus, modalAudit, modalDocs, modalContracts, modalGithub, modalChains, modalPortfolio, modalDividends, modalOracleTelemetry, modalAttestation, modalInsurance, modalFees]
      .forEach(m => { if (m && e.target === m) m.classList.remove('open'); });
  });

  // --- Mobile Drawer ---
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawerClose = document.getElementById('mobile-drawer-close');
  if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', () => { if (mobileDrawer) mobileDrawer.classList.add('open'); });
  if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', () => { if (mobileDrawer) mobileDrawer.classList.remove('open'); });
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', () => { if (mobileDrawer) mobileDrawer.classList.remove('open'); });
  });

  // --- Institutional Waitlist Form ---
  const instForm = document.getElementById('institutional-form');
  if (instForm) {
    instForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('inst-name')?.value?.trim();
      const email = document.getElementById('inst-email')?.value?.trim();
      const aum = document.getElementById('inst-aum')?.value;
      if (!name || !email || !aum) {
        showToast('Please fill in all required fields.', 'warning');
        return;
      }
      const btn = document.getElementById('btn-inst-apply');
      if (btn) { btn.textContent = 'Application Submitted'; btn.disabled = true; btn.style.opacity = '0.75'; }
      showToast(
        `Application received for <strong>${name}</strong>.<br>Our institutional desk will contact ${email} within 48 hours.`,
        'success', 8000
      );
    });
  }

  // --- Animated Counters ---
  initCounterAnimations();

  // --- Live Price Fetching (Yahoo Finance) ---
  refreshAllPrices();
  setInterval(refreshAllPrices, 60000);

});
