// ============================================================
// INSTITUTIONAL LIQUIDITY STREAM FEED COMPONENT
// ============================================================

let streamFeedList = null;
let streamTotalVolume = null;
let currentStreamVolume = 42180500;

export function addStreamEvent(evt) {
  streamFeedList = streamFeedList || document.getElementById('stream-feed-list');
  streamTotalVolume = streamTotalVolume || document.getElementById('stream-total-volume');
  if (!streamFeedList) return;

  if (evt.amountUSD) {
    currentStreamVolume += evt.amountUSD;
    if (streamTotalVolume) streamTotalVolume.textContent = `$${currentStreamVolume.toLocaleString()} USD`;
  }

  const item = document.createElement('div');
  item.className = 'stream-item';
  item.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span class="badge ${evt.type === 'mint' || evt.type === 'buy' ? 'badge-accent' : 'badge-warning'}" style="font-size: 10px;">${evt.badge || 'PRE-SALE BUY'}</span>
      <span>${evt.text}</span>
    </div>
    <span class="mono-small" style="color: #A3A693;">${evt.chain || 'Robinhood L2'} • Just now</span>
  `;

  streamFeedList.insertBefore(item, streamFeedList.firstChild);
  if (streamFeedList.children.length > 5) {
    streamFeedList.removeChild(streamFeedList.lastChild);
  }
}

export function initLiquidityStream() {
  streamFeedList = document.getElementById('stream-feed-list');
  streamTotalVolume = document.getElementById('stream-total-volume');

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
    addStreamEvent(evt);
  }, 8000);
}
