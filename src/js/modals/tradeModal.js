// ============================================================
// TRADING TERMINAL MODAL MODULE
// ============================================================

import { ASSETS } from '../config.js';
import { showToast } from '../services/toastService.js';
import { walletState, requireWalletConnection, updatePortfolioUI } from '../services/walletService.js';
import { drawDynamicChart } from '../components/chart.js';

let currentTradingSymbol = 'aAAPL';
let tradeMode = 'buy';

export function openTradeModal(symbol = 'aAAPL') {
  const modalTrade = document.getElementById('modal-trade');
  if (!modalTrade) return;

  const asset = ASSETS.find(a => a.symbol === symbol) || ASSETS[0];
  currentTradingSymbol = asset.symbol;
  tradeMode = 'buy';

  const tradeTabBuy      = document.getElementById('trade-tab-buy');
  const tradeTabSell     = document.getElementById('trade-tab-sell');
  const tradeInputLabel  = document.getElementById('trade-input-label');
  const tradeInputBadge  = document.getElementById('trade-input-badge');
  const tradeOutputLabel = document.getElementById('trade-output-label');
  const btnSubmitOrder   = document.getElementById('btn-submit-order');
  const tradeInputUsd    = document.getElementById('trade-input-usd');

  if (tradeTabBuy)  tradeTabBuy.className  = 'btn btn-primary';
  if (tradeTabSell) tradeTabSell.className = 'btn btn-secondary';
  if (tradeInputLabel)  tradeInputLabel.textContent  = 'Pay USD Amount';
  if (tradeInputBadge)  tradeInputBadge.textContent  = 'USD';
  if (tradeOutputLabel) tradeOutputLabel.textContent = 'You Receive';
  if (btnSubmitOrder)   btnSubmitOrder.textContent   = 'Execute Buy Order';
  if (tradeInputUsd)    tradeInputUsd.value = '1000';

  const titleEl = document.getElementById('trade-modal-title');
  const subEl   = document.getElementById('trade-modal-subtitle');
  const priceEl = document.getElementById('trade-modal-price');

  if (titleEl) titleEl.textContent = `${asset.symbol} — ${asset.underlier}`;
  if (subEl)   subEl.textContent   = `ISIN: ${asset.isin} • 100% Swiss Custody`;
  if (priceEl) priceEl.textContent = `$${asset.price.toFixed(2)} USD`;

  const changeBadge = document.getElementById('trade-modal-change-badge');
  if (changeBadge) {
    const pct = asset.liveChangePct !== undefined ? asset.liveChangePct : 1.20;
    const sign = pct >= 0 ? '+' : '';
    changeBadge.textContent = `${sign}${pct.toFixed(2)}% 24h`;
    changeBadge.className = pct >= 0 ? 'badge badge-accent' : 'badge badge-danger';
  }

  const tradeIcon = document.getElementById('trade-modal-icon');
  if (tradeIcon) {
    tradeIcon.style.backgroundColor = asset.iconBg;
    tradeIcon.style.border = asset.border;
    tradeIcon.innerHTML = asset.logoSvg;
  }

  const importBtn = document.getElementById('btn-import-trade-token');
  if (importBtn) importBtn.dataset.symbol = asset.symbol;

  drawDynamicChart('modal-chart-svg', '1D');
  updateTradeModalMath();
  modalTrade.classList.add('open');
}

export function closeTradeModal() {
  const modalTrade = document.getElementById('modal-trade');
  if (modalTrade) modalTrade.classList.remove('open');
}

export function updateTradeModalMath() {
  const tradeInputUsd = document.getElementById('trade-input-usd');
  const tradeOutputTokens = document.getElementById('trade-output-tokens');
  if (!tradeInputUsd || !tradeOutputTokens) return;

  const val = parseFloat(tradeInputUsd.value) || 0;
  const asset = ASSETS.find(a => a.symbol === currentTradingSymbol) || ASSETS[0];

  if (tradeMode === 'buy') {
    const count = (val / asset.price).toFixed(4);
    tradeOutputTokens.value = `${count} ${asset.symbol}`;
  } else {
    const usdTotal = (val * asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    tradeOutputTokens.value = `$${usdTotal} USD`;
  }
}

export function initTradeModalListeners() {
  const tradeTabBuy     = document.getElementById('trade-tab-buy');
  const tradeTabSell    = document.getElementById('trade-tab-sell');
  const tradeInputLabel = document.getElementById('trade-input-label');
  const tradeInputBadge = document.getElementById('trade-input-badge');
  const tradeOutputLabel= document.getElementById('trade-output-label');
  const btnSubmitOrder  = document.getElementById('btn-submit-order');
  const tradeInputUsd   = document.getElementById('trade-input-usd');
  const modalTradeClose = document.getElementById('modal-trade-close');
  const btnTradeMax     = document.getElementById('btn-trade-max');
  const tradeModalBalEl = document.getElementById('trade-modal-cash-balance');

  const updateModalAvailableText = () => {
    if (!tradeModalBalEl) return;
    if (tradeMode === 'buy') {
      const formattedCash = walletState.portfolio.cashUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      tradeModalBalEl.textContent = `$${formattedCash} tUSDC`;
    } else {
      const holding = walletState.portfolio.holdings.find(h => h.symbol === currentTradingSymbol);
      const shares = holding ? holding.shares.toFixed(4) : '0.0000';
      tradeModalBalEl.textContent = `${shares} ${currentTradingSymbol}`;
    }
  };

  if (tradeTabBuy && tradeTabSell) {
    tradeTabBuy.addEventListener('click', () => {
      tradeMode = 'buy';
      tradeTabBuy.className = 'btn btn-primary';
      tradeTabSell.className = 'btn btn-secondary';
      if (tradeInputLabel)  tradeInputLabel.textContent = 'Pay USD Amount';
      if (tradeInputBadge)  tradeInputBadge.textContent = 'USD';
      if (tradeOutputLabel) tradeOutputLabel.textContent = 'You Receive';
      if (btnSubmitOrder)   btnSubmitOrder.textContent = 'Execute Buy Order';
      if (tradeInputUsd && (tradeInputUsd.value === '5' || !tradeInputUsd.value)) tradeInputUsd.value = '1000';
      updateModalAvailableText();
      updateTradeModalMath();
    });

    tradeTabSell.addEventListener('click', () => {
      tradeMode = 'sell';
      tradeTabSell.className = 'btn btn-primary';
      tradeTabBuy.className = 'btn btn-secondary';
      if (tradeInputLabel)  tradeInputLabel.textContent = 'Sell Token Amount';
      if (tradeInputBadge)  tradeInputBadge.textContent = currentTradingSymbol;
      if (tradeOutputLabel) tradeOutputLabel.textContent = 'Estimated USD Payout';
      if (btnSubmitOrder)   btnSubmitOrder.textContent = 'Execute Sell Order';
      if (tradeInputUsd && (tradeInputUsd.value === '1000' || !tradeInputUsd.value)) tradeInputUsd.value = '5';
      updateModalAvailableText();
      updateTradeModalMath();
    });
  }

  if (btnTradeMax) {
    btnTradeMax.addEventListener('click', () => {
      if (!requireWalletConnection('using MAX amount')) return;
      if (tradeMode === 'buy') {
        tradeInputUsd.value = walletState.portfolio.cashUsd.toFixed(2);
      } else {
        const holding = walletState.portfolio.holdings.find(h => h.symbol === currentTradingSymbol);
        tradeInputUsd.value = holding ? holding.shares.toFixed(4) : '0';
      }
      updateTradeModalMath();
    });
  }

  if (tradeInputUsd) tradeInputUsd.addEventListener('input', updateTradeModalMath);
  if (modalTradeClose) modalTradeClose.addEventListener('click', closeTradeModal);

  if (btnSubmitOrder) {
    btnSubmitOrder.addEventListener('click', () => {
      if (!requireWalletConnection('executing trade orders')) return;
      const val = parseFloat(tradeInputUsd.value) || 0;
      const asset = ASSETS.find(a => a.symbol === currentTradingSymbol) || ASSETS[0];
      if (val <= 0) { showToast('Please enter a valid amount.', 'warning'); return; }

      if (tradeMode === 'buy') {
        if (val > walletState.portfolio.cashUsd) {
          showToast(`Insufficient tUSDC balance ($${walletState.portfolio.cashUsd.toFixed(2)} available). Click 'Claim 10,000 tUSDC Testnet Faucet' in your Profile Menu first.`, 'warning', 8000);
          const modalProfile = document.getElementById('modal-profile');
          if (modalProfile) modalProfile.classList.add('open');
          return;
        }
        let existing = walletState.portfolio.holdings.find(h => h.symbol === asset.symbol);
        if (existing) {
          existing.shares += (val / asset.price);
        } else {
          walletState.portfolio.holdings.push({ symbol: asset.symbol, shares: (val / asset.price), buyPrice: asset.price });
        }
        walletState.portfolio.cashUsd = Math.max(0, walletState.portfolio.cashUsd - val);
      } else {
        const tokenQty = val;
        const usdReceived = tokenQty * asset.price;
        let existing = walletState.portfolio.holdings.find(h => h.symbol === asset.symbol);
        if (!existing || existing.shares < tokenQty) {
          showToast(`Insufficient ${asset.symbol} token balance to sell.`, 'warning');
          return;
        }
        existing.shares = Math.max(0, existing.shares - tokenQty);
        walletState.portfolio.cashUsd += usdReceived;
      }

      updatePortfolioUI();
      const simTxHash = '0xSIM' + Array.from({length: 6}, () => Math.floor(Math.random()*16).toString(16).toUpperCase()).join('') + '...';
      const action = tradeMode === 'buy' ? 'Simulated Buy' : 'Simulated Sell';
      const tradeOutputTokens = document.getElementById('trade-output-tokens');
      showToast(
        `Sandbox Demo — ${action}: <strong>${tradeOutputTokens ? tradeOutputTokens.value : ''}</strong><br><small style="opacity:0.85">Simulated Tx: ${simTxHash} • Robinhood Testnet (Chain 5050) • Swissquote Custody Reserved • Mainnet launches Q3 2026</small>`,
        'success', 9000
      );
      closeTradeModal();
    });
  }
}
