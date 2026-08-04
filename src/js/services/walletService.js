// ============================================================
// WEB3 WALLET & PORTFOLIO STATE SERVICE MODULE
// ============================================================

import { ASSETS, CONTRACT_ADDRESSES, PRESALE_CONFIG } from '../config.js';
import { showToast } from './toastService.js';

export const walletState = {
  isConnected: false,
  address: null,
  activeWalletName: null,
  portfolio: {
    cashUsd: 0.00,
    holdings: []
  }
};

export function requireWalletConnection(actionName = 'perform this action') {
  if (!walletState.isConnected) {
    showToast(`Please connect your Web3 wallet before ${actionName}.`, 'warning');
    const modalWallet = document.getElementById('modal-wallet');
    if (modalWallet) modalWallet.classList.add('open');
    return false;
  }
  return true;
}

export function updatePortfolioUI() {
  if (!walletState.isConnected) return;

  let holdingsValueUsd = 0;
  const activeHoldings = walletState.portfolio.holdings.filter(h => h.shares > 0.0001);

  activeHoldings.forEach(h => {
    let price = h.buyPrice;
    if (h.symbol === '$AVA') {
      price = 0.0005;
    } else {
      const asset = ASSETS.find(a => a.symbol === h.symbol);
      if (asset) price = asset.price;
    }
    holdingsValueUsd += h.shares * price;
  });

  const formattedCash = walletState.portfolio.cashUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const profileCashValEl = document.getElementById('profile-cash-val');
  const portCashValEl = document.getElementById('port-cash-val');
  const presaleBalEl = document.getElementById('presale-available-balance');
  const tradeModalBalEl = document.getElementById('trade-modal-cash-balance');
  const simBalEl = document.getElementById('simulator-cash-balance');

  if (profileCashValEl) profileCashValEl.textContent = `$${formattedCash} tUSDC`;
  if (portCashValEl) portCashValEl.textContent = `$${formattedCash}`;
  if (presaleBalEl) presaleBalEl.textContent = `$${formattedCash} tUSDC`;
  if (tradeModalBalEl) tradeModalBalEl.textContent = `$${formattedCash} tUSDC`;
  if (simBalEl) simBalEl.textContent = `$${formattedCash} tUSDC`;

  const totalVal = walletState.portfolio.cashUsd + holdingsValueUsd;
  const formattedTotal = totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const portTotalValEl = document.getElementById('port-total-val');
  const profilePortValEl = document.getElementById('profile-portfolio-val');
  if (portTotalValEl) portTotalValEl.textContent = `$${formattedTotal}`;
  if (profilePortValEl) profilePortValEl.textContent = `$${formattedTotal} USD`;

  const portHoldingsCountEl = document.getElementById('port-holdings-count');
  if (portHoldingsCountEl) portHoldingsCountEl.textContent = `${activeHoldings.length} ${activeHoldings.length === 1 ? 'Asset' : 'Assets'}`;

  const portEstDivsEl = document.getElementById('port-est-divs');
  if (portEstDivsEl) {
    const estDivs = holdingsValueUsd * 0.027; // ~2.7% yield
    portEstDivsEl.textContent = `+$${estDivs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr`;
  }

  const btnOpenPortSpan = document.querySelector('#btn-open-portfolio span');
  if (btnOpenPortSpan) {
    const formattedK = totalVal >= 1000 ? `${(totalVal / 1000).toFixed(1)}k` : totalVal.toFixed(0);
    btnOpenPortSpan.textContent = `Portfolio ($${formattedK})`;
  }

  // Update Holdings List
  const listEl = document.getElementById('portfolio-holdings-list');
  if (listEl) {
    if (activeHoldings.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--color-taupe); font-size: 13.5px;">
          No active tokenized stock holdings yet. Use the trading terminal to buy aTokens or claim funds from the Testnet Faucet.
        </div>
      `;
    } else {
      listEl.innerHTML = activeHoldings.map(h => {
        let asset;
        if (h.symbol === '$AVA') {
          asset = {
            symbol: '$AVA',
            name: 'Arkava Pre-Sale Token',
            price: 0.0005,
            iconBg: '#A6B92C',
            border: '1px solid #C9DB3A',
            logoSvg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="#17190F"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
          };
        } else {
          asset = ASSETS.find(a => a.symbol === h.symbol) || ASSETS[0];
        }

        const valUSD = (h.shares * asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
          <div class="holding-row">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="asset-icon" style="background:${asset.iconBg}; border:${asset.border}; width:32px; height:32px;">
                ${asset.logoSvg}
              </div>
              <div>
                <strong style="font-size: 14.5px; display: block; color: var(--color-navy);">${asset.symbol} (${asset.name})</strong>
                <span class="mono-small text-muted">${h.shares.toFixed(2)} Tokens @ $${asset.price.toFixed(2)}</span>
              </div>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <div class="mono-large" style="font-size: 16px; font-weight: 600;">$${valUSD} USD</div>
              <button class="btn btn-secondary btn-import-token" data-symbol="${asset.symbol}" style="font-size: 11px; padding: 2px 8px; height: 24px;">+ Import to Wallet</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  saveWalletStateToStorage();
}

export function executePresaleBuy(amountUSD = 1000) {
  if (PRESALE_CONFIG.isClosed) {
    showToast('Pre-Sale Stage 1 has officially closed (Ended Thursday 20:00 UTC). TGE Mainnet listing on Uniswap / Robinhood L2 in progress.', 'info', 9000);
    return null;
  }

  if (!requireWalletConnection('purchasing $AVA Pre-Sale tokens')) return null;

  if (amountUSD <= 0) {
    showToast('Please enter a valid USD amount to purchase.', 'warning');
    return null;
  }

  if (amountUSD > walletState.portfolio.cashUsd) {
    showToast(`Insufficient tUSDC balance ($${walletState.portfolio.cashUsd.toFixed(2)} available). Click 'Claim 10,000 tUSDC Testnet Faucet' in your Profile Menu first.`, 'warning', 8000);
    const modalProfile = document.getElementById('modal-profile');
    if (modalProfile) modalProfile.classList.add('open');
    return null;
  }

  const basePrice = 0.0005;
  const baseTokens = amountUSD / basePrice;
  const bonusTokens = baseTokens * 0.05; // 5% bonus
  const totalTokens = baseTokens + bonusTokens;

  // Deduct tUSDC balance
  walletState.portfolio.cashUsd = Math.max(0, walletState.portfolio.cashUsd - amountUSD);

  // Add $AVA pre-sale token allocation to user's wallet portfolio
  let avaHolding = walletState.portfolio.holdings.find(h => h.symbol === '$AVA');
  if (avaHolding) {
    avaHolding.shares += totalTokens;
  } else {
    walletState.portfolio.holdings.push({ symbol: '$AVA', shares: totalTokens, buyPrice: basePrice });
  }

  updatePortfolioUI();

  const simTxHash = '0xPRE' + Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('') + '...';
  return {
    amountUSD,
    baseTokens,
    bonusTokens,
    totalTokens,
    txHash: simTxHash
  };
}

export async function connectWallet(walletName = 'MetaMask') {
  let realAddress = null;

  // Real Web3 Provider Connection (MetaMask, Coinbase, OKX, Rabby, Trust Wallet)
  const provider = window.ethereum || window.coinbaseWalletExtension || window.okxwallet || window.rabby;
  if (provider && typeof provider.request === 'function') {
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        realAddress = accounts[0];
      }
    } catch (_err) {
      showToast('Wallet connection prompt was rejected.', 'info');
      return;
    }
  }

  const finalAddress = realAddress || '0x71C86a2D49b258E10149a7407358172901309852';

  // Open Web3 Signature & Connection Confirmation Modal
  const modalWallet = document.getElementById('modal-wallet');
  const modalWalletConnect = document.getElementById('modal-walletconnect');
  const modalConfirm = document.getElementById('modal-wallet-confirm');

  if (modalWallet) modalWallet.classList.remove('open');
  if (modalWalletConnect) modalWalletConnect.classList.remove('open');

  const confirmNameEl = document.getElementById('confirm-wallet-name');
  const confirmAddrEl = document.getElementById('confirm-wallet-address');
  const confirmSignEl = document.getElementById('confirm-sign-message');

  if (confirmNameEl) confirmNameEl.textContent = `${walletName} • Robinhood Chain (L2)`;
  if (confirmAddrEl) confirmAddrEl.textContent = finalAddress;
  if (confirmSignEl) {
    const nonce = '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16);
    const ts = new Date().toISOString();
    confirmSignEl.textContent = `Welcome to Arkava!\nSign this message to authenticate your wallet connection.\n\nAccount: ${finalAddress}\nNonce: ${nonce}\nTimestamp: ${ts}`;
  }

  if (modalConfirm) modalConfirm.classList.add('open');

  // Store pending connection parameters
  walletState.pendingConnect = { walletName, finalAddress };
}

export async function finalizeWalletConnection() {
  if (!walletState.pendingConnect) return;
  const { walletName, finalAddress } = walletState.pendingConnect;

  // Execute REAL Web3 Personal Signature Prompt to Wallet Extension (OKX, MetaMask, Coinbase, Rabby)
  const provider = window.ethereum || window.coinbaseWalletExtension || window.okxwallet || window.rabby;
  if (provider && typeof provider.request === 'function' && finalAddress && finalAddress.startsWith('0x')) {
    try {
      const confirmSignEl = document.getElementById('confirm-sign-message');
      const messageToSign = confirmSignEl ? confirmSignEl.textContent : `Welcome to Arkava!\nSign this message to authenticate your wallet connection.\nAccount: ${finalAddress}`;

      // Call native wallet personal_sign
      await provider.request({
        method: 'personal_sign',
        params: [messageToSign, finalAddress]
      });
    } catch (_err) {
      showToast('Wallet signature request was rejected in extension popup.', 'warning');
      const modalConfirm = document.getElementById('modal-wallet-confirm');
      if (modalConfirm) modalConfirm.classList.remove('open');
      walletState.pendingConnect = null;
      return;
    }
  }

  connectWalletAddress(walletName, finalAddress);
}

export function saveWalletStateToStorage() {
  if (!walletState.isConnected || !walletState.address) return;
  const key = `arkava_db_wallet_${walletState.address.toLowerCase()}`;
  const dataToSave = {
    address: walletState.address,
    activeWalletName: walletState.activeWalletName,
    cashUsd: walletState.portfolio.cashUsd,
    holdings: walletState.portfolio.holdings,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(dataToSave));
  localStorage.setItem('arkava_last_connected_wallet', walletState.address);
}

export function loadWalletStateFromStorage(address) {
  if (!address) return false;
  const key = `arkava_db_wallet_${address.toLowerCase()}`;
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      walletState.portfolio.cashUsd = typeof data.cashUsd === 'number' ? data.cashUsd : 0.00;
      walletState.portfolio.holdings = Array.isArray(data.holdings) ? data.holdings : [];
      return true;
    } catch (err) {
      console.warn('Failed to parse saved wallet database record:', err);
    }
  }
  return false;
}

export function connectWalletAddress(walletName = 'MetaMask', customAddr = null) {
  let finalAddress = customAddr;
  if (!finalAddress) {
    if (window.ethereum && window.ethereum.selectedAddress) {
      finalAddress = window.ethereum.selectedAddress;
    } else {
      const hexChars = '0123456789abcdef';
      let randomHex = '0x';
      for (let i = 0; i < 40; i++) {
        randomHex += hexChars[Math.floor(Math.random() * 16)];
      }
      finalAddress = randomHex;
    }
  }

  if (walletState.pendingConnect && typeof walletState.pendingConnect === 'object') {
    if (walletState.pendingConnect.finalAddress.toLowerCase() !== finalAddress.toLowerCase()) {
      showToast(`Wallet signature address mismatch. Expected: <code>${walletState.pendingConnect.finalAddress.slice(0, 6)}...</code>`, 'error', 8000);
      const modalConfirm = document.getElementById('modal-wallet-confirm');
      if (modalConfirm) modalConfirm.classList.remove('open');
      walletState.pendingConnect = null;
      return;
    }
  }

  const shortAddr = `${finalAddress.slice(0, 6)}...${finalAddress.slice(-4)}`;

  walletState.isConnected = true;
  walletState.activeWalletName = walletName;
  walletState.address = finalAddress;
  walletState.pendingConnect = null;

  const hasSavedData = loadWalletStateFromStorage(finalAddress);
  if (!hasSavedData) {
    walletState.portfolio.cashUsd = 0.00;
    walletState.portfolio.holdings = [];
  }

  saveWalletStateToStorage();

  const btnConnectWallet = document.getElementById('btn-connect-wallet');
  const modalConfirm = document.getElementById('modal-wallet-confirm');

  if (btnConnectWallet) {
    btnConnectWallet.innerHTML = `
      <div style="width:20px; height:20px; border-radius:50%; background:var(--color-lime); display:flex; align-items:center; justify-content:center; color:#17190F; flex-shrink:0;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <span>${shortAddr}</span>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.7;"><path d="M6 9l6 6 6-6"/></svg>
    `;
    btnConnectWallet.style.backgroundColor = 'var(--color-navy)';
    btnConnectWallet.style.borderColor = 'var(--color-dark-sage)';
  }
  if (modalConfirm) modalConfirm.classList.remove('open');

  const profileFullAddr = document.getElementById('profile-full-address');
  if (profileFullAddr) profileFullAddr.textContent = finalAddress;

  const walletFaucetSection = document.getElementById('wallet-modal-faucet-section');
  if (walletFaucetSection) walletFaucetSection.style.display = 'block';

  const refLinkInput = document.getElementById('referral-link-input');
  if (refLinkInput) {
    refLinkInput.value = `https://arkava.cloud/?ref=${finalAddress}`;
    refLinkInput.style.opacity = '1';
  }

  showToast(`Wallet Signature Approved: <code>${shortAddr}</code>. Connected to <strong>${walletName}</strong>`, 'success', 8000);
  updatePortfolioUI();
}

export function disconnectWallet() {
  localStorage.removeItem('arkava_last_connected_wallet');
  walletState.isConnected = false;
  walletState.address = null;
  walletState.activeWalletName = null;
  walletState.portfolio.cashUsd = 0;
  walletState.portfolio.holdings = [];

  const btnConnectWallet = document.getElementById('btn-connect-wallet');
  const modalProfile = document.getElementById('modal-profile');

  if (btnConnectWallet) {
    btnConnectWallet.innerHTML = `<span>Connect Wallet</span>`;
    btnConnectWallet.style.backgroundColor = '';
    btnConnectWallet.style.borderColor = '';
  }
  if (modalProfile) modalProfile.classList.remove('open');

  const refLinkInput = document.getElementById('referral-link-input');
  if (refLinkInput) {
    refLinkInput.value = 'Connect Wallet to Generate Referral Link';
    refLinkInput.style.opacity = '0.75';
  }

  showToast('Web3 wallet disconnected.', 'info');
  updatePortfolioUI();
}

export function claimTestnetFaucet() {
  if (!requireWalletConnection('claiming testnet faucet funds')) return;
  walletState.portfolio.cashUsd += 10000;
  updatePortfolioUI();
  showToast(
    `<strong>Testnet Faucet Claimed:</strong> 10,000 tUSDC credited to account <code>${walletState.address}</code>.<br><small style="opacity:0.85">Robinhood Testnet (Chain 5050) &bull; Test minting &amp; trading aAAPL, aNVDA &amp; aTSLA now active.</small>`,
    'success', 8000
  );
}

export async function importTokenToWallet(symbol = 'aAAPL') {
  const asset = ASSETS.find(a => a.symbol === symbol) || ASSETS[0];
  const tokenAddress = CONTRACT_ADDRESSES[asset.symbol] || CONTRACT_ADDRESSES.aAAPL;
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

export function autoConnectLastWallet() {
  const lastAddr = localStorage.getItem('arkava_last_connected_wallet');
  if (lastAddr) {
    const key = `arkava_db_wallet_${lastAddr.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    let walletName = 'Web3 Wallet';
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.activeWalletName) walletName = data.activeWalletName;
      } catch (e) { }
    }
    connectWalletAddress(walletName, lastAddr);
  }
}
