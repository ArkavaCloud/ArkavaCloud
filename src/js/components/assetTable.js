// ============================================================
// RWA ASSET TABLE COMPONENT
// ============================================================

import { ASSETS } from '../config.js';

let currentCategoryFilter = 'all';
let searchQuery = '';

export function renderAssetTable(onTradeClick, onDetailsClick) {
  const tableBody = document.getElementById('asset-table-body');
  if (!tableBody) return;

  const filtered = ASSETS.filter(asset => {
    const matchesCat = currentCategoryFilter === 'all' || asset.category === currentCategoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      asset.symbol.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      asset.underlier.toLowerCase().includes(q) ||
      asset.isin.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--color-taupe);">
          No RWA tokenized assets found matching "<strong>${searchQuery}</strong>".
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(asset => {
    const livePct = asset.liveChangePct !== undefined ? asset.liveChangePct : 1.20;
    const sign = livePct >= 0 ? '+' : '';
    const badgeClass = livePct >= 0 ? 'badge badge-accent' : 'badge badge-danger';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="asset-icon" style="background: ${asset.iconBg}; border: ${asset.border};">
              ${asset.logoSvg}
            </div>
            <div>
              <strong class="asset-symbol" style="display: block;">${asset.symbol}</strong>
              <span class="asset-name text-muted">${asset.name}</span>
            </div>
          </div>
        </td>
        <td>
          <span style="font-weight: 500;">${asset.underlier}</span>
          <span class="mono-small text-muted" style="display: block; font-size: 11px;">ISIN: ${asset.isin}</span>
        </td>
        <td class="mono-large" id="price-${asset.symbol}">
          $${asset.price.toFixed(2)}
        </td>
        <td>
          <span class="${badgeClass}">${sign}${livePct.toFixed(2)}%</span>
        </td>
        <td>
          <span class="mono-small text-sage" style="font-weight: 600;">${asset.collateral}</span>
          <span class="mono-small text-muted" style="display: block; font-size: 11px;">Swissquote Custody</span>
        </td>
        <td class="mono-small text-muted">
          ${asset.volume}
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-primary btn-trade-row" data-symbol="${asset.symbol}" style="padding: 4px 12px; height: 32px; font-size: 12px;">
              Mint / Trade
            </button>
            <button class="btn btn-secondary btn-detail-row" data-symbol="${asset.symbol}" style="padding: 4px 10px; height: 32px; font-size: 12px;">
              Details
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tableBody.querySelectorAll('.btn-trade-row').forEach(btn => {
    btn.addEventListener('click', e => {
      const sym = e.currentTarget.dataset.symbol;
      if (typeof onTradeClick === 'function') onTradeClick(sym);
    });
  });

  tableBody.querySelectorAll('.btn-detail-row').forEach(btn => {
    btn.addEventListener('click', e => {
      const sym = e.currentTarget.dataset.symbol;
      if (typeof onDetailsClick === 'function') onDetailsClick(sym);
    });
  });
}

export function initAssetTableFilters(onTableUpdate) {
  document.querySelectorAll('#explorer-tabs .tab-btn').forEach(tab => {
    tab.addEventListener('click', e => {
      document.querySelectorAll('#explorer-tabs .tab-btn').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentCategoryFilter = e.target.dataset.category;
      if (typeof onTableUpdate === 'function') onTableUpdate();
    });
  });

  const searchInput = document.getElementById('asset-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = e.target.value;
      if (typeof onTableUpdate === 'function') onTableUpdate();
    });
  }
}
