// ============================================================
// PRE-SALE TOKEN ENGINE & REFERRAL SYSTEM MODULE
// ============================================================

import { PRESALE_CONFIG } from '../config.js';
import { showToast } from '../services/toastService.js';
import { walletState, executePresaleBuy, importTokenToWallet } from '../services/walletService.js';
import { addStreamEvent } from './stream.js';

export function updatePresaleMath() {
  const presaleInputUsd = document.getElementById('presale-input-usd');
  const presaleOutputArka = document.getElementById('presale-output-arka');
  const presaleBonusVal = document.getElementById('presale-bonus-val');

  if (!presaleInputUsd || !presaleOutputArka) return;

  const usdVal = parseFloat(presaleInputUsd.value) || 0;
  const baseTokens = usdVal / PRESALE_CONFIG.presalePrice;
  const bonusTokens = baseTokens * (PRESALE_CONFIG.earlyBirdBonusPct / 100);
  const totalTokens = baseTokens + bonusTokens;

  presaleOutputArka.value = `${totalTokens.toLocaleString('en-US', { maximumFractionDigits: 2 })} $AVA`;
  if (presaleBonusVal) {
    presaleBonusVal.textContent = `+${bonusTokens.toLocaleString('en-US', { maximumFractionDigits: 2 })} $AVA (5% Bonus)`;
  }
}

export function updatePresaleProgressBar() {
  const raisedText = document.getElementById('presale-raised-text');
  const progressFill = document.getElementById('presale-progress-fill');
  const progressPctText = document.getElementById('presale-progress-pct');

  if (raisedText) {
    raisedText.textContent = `$${PRESALE_CONFIG.currentRaised.toLocaleString()} USD / $${PRESALE_CONFIG.targetRaised.toLocaleString()} USD`;
  }

  const pct = Math.min(100, (PRESALE_CONFIG.currentRaised / PRESALE_CONFIG.targetRaised) * 100);
  if (progressFill) progressFill.style.width = `${pct.toFixed(2)}%`;
  if (progressPctText) progressPctText.textContent = `${pct.toFixed(2)}% Filled`;
}

export function updateReferralUI() {
  const refLinkInput = document.getElementById('referral-link-input');
  if (!refLinkInput) return;

  if (!walletState.isConnected || !walletState.address) {
    refLinkInput.value = 'Connect Wallet to Generate Referral Link';
    refLinkInput.style.opacity = '0.75';
  } else {
    refLinkInput.value = `https://arkava.cloud/?ref=${walletState.address}`;
    refLinkInput.style.opacity = '1';
  }
}

export function initPresaleCountdownTimer() {
  const countdownText = document.getElementById('presale-countdown-text');
  const statusBadge = document.getElementById('presale-status-badge');
  const btnBuy = document.getElementById('btn-buy-presale');
  const presaleInput = document.getElementById('presale-input-usd');
  const pulseDot = document.getElementById('presale-pulse-dot');

  if (!countdownText) return;

  const targetTime = new Date(PRESALE_CONFIG.endDateISO).getTime();

  const updateCountdown = () => {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      PRESALE_CONFIG.isClosed = true;
      countdownText.textContent = 'CLOSED (Ended Thursday 20:00 UTC)';
      countdownText.style.color = 'var(--color-taupe)';
      if (pulseDot) {
        pulseDot.style.background = '#888888';
        pulseDot.style.boxShadow = 'none';
        pulseDot.style.animation = 'none';
      }
      if (statusBadge) {
        statusBadge.textContent = '● Phase 1 Closed';
        statusBadge.className = 'badge badge-standard';
        statusBadge.style.opacity = '0.7';
      }
      if (btnBuy) {
        btnBuy.textContent = 'Pre-Sale Stage 1 Closed — TGE Listing Pending';
        btnBuy.disabled = true;
        btnBuy.style.opacity = '0.6';
        btnBuy.style.cursor = 'not-allowed';
      }
      if (presaleInput) {
        presaleInput.disabled = true;
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');
    countdownText.textContent = `${pad(days)}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  };

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

export function initPresaleEngine() {
  const presaleInputUsd = document.getElementById('presale-input-usd');
  const btnBuyPresale = document.getElementById('btn-buy-presale');
  const btnCopyRefLink = document.getElementById('btn-copy-ref-link');

  if (presaleInputUsd) {
    presaleInputUsd.addEventListener('input', updatePresaleMath);
  }

  updatePresaleMath();
  updatePresaleProgressBar();
  updateReferralUI();
  initPresaleCountdownTimer();

  const btnPresaleMax = document.getElementById('btn-presale-max');
  if (btnPresaleMax) {
    btnPresaleMax.addEventListener('click', () => {
      if (!walletState.isConnected) {
        requireWalletConnection('using MAX pre-sale purchase');
        return;
      }
      if (presaleInputUsd) {
        presaleInputUsd.value = walletState.portfolio.cashUsd.toFixed(2);
        updatePresaleMath();
      }
    });
  }

  if (btnBuyPresale) {
    btnBuyPresale.addEventListener('click', () => {
      const usdVal = parseFloat(presaleInputUsd?.value) || 0;
      const res = executePresaleBuy(usdVal);
      if (!res) return;

      PRESALE_CONFIG.currentRaised += usdVal;
      updatePresaleProgressBar();
      updateReferralUI();

      const totalTokensStr = res.totalTokens.toLocaleString('en-US', { maximumFractionDigits: 2 });
      const addrShort = walletState.address ? `${walletState.address.slice(0, 6)}...${walletState.address.slice(-4)}` : '0x71C...49b2';

      const tweetText = encodeURIComponent(`Just acquired ${totalTokensStr} $AVA tokens in Stage 1 Pre-Sale on @ArkavaProtocol! Stage 1 ends Thursday 20:00 UTC. Join using my referral link: https://arkava.cloud/?ref=${walletState.address}`);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

      showToast(
        `Pre-Sale Purchase Successful! <strong>${totalTokensStr} $AVA</strong> credited to account.<br><small style="opacity:0.85">Tx Hash: ${res.txHash} • Pre-Sale Price: $0.0005 • TGE Listing: $0.0015</small><br><a href="${tweetUrl}" target="_blank" rel="noopener" style="display:inline-block; margin-top:6px; background:#000; color:#fff; padding:4px 10px; border-radius:4px; font-size:11px; font-weight:600; text-decoration:none;">Share Purchase on X (Twitter) →</a>`,
        'success', 10000
      );

      addStreamEvent({
        type: 'buy',
        badge: 'PRE-SALE BUY',
        text: `Purchased <strong>${totalTokensStr} $AVA</strong> ($${usdVal.toLocaleString()} USD)`,
        chain: 'Robinhood L2',
        amountUSD: usdVal
      });

      // Prompt token registration in wallet
      setTimeout(() => {
        importTokenToWallet('$AVA');
      }, 1500);
    });
  }

  if (btnCopyRefLink) {
    btnCopyRefLink.addEventListener('click', () => {
      if (!walletState.isConnected || !walletState.address) {
        showToast('Please connect your Web3 wallet to generate and copy your referral link.', 'warning');
        const modalWalletConnect = document.getElementById('modal-walletconnect');
        if (modalWalletConnect) modalWalletConnect.classList.add('open');
        return;
      }
      const refLinkInput = document.getElementById('referral-link-input');
      const url = refLinkInput?.value || `https://arkava.cloud/?ref=${walletState.address}`;
      navigator.clipboard.writeText(url).then(() => {
        showToast('Referral link copied to clipboard! Earn 5% bonus $AVA on all referred purchases.', 'success');
      }).catch(() => {
        showToast('Referral link copied to clipboard!', 'success');
      });
    });
  }
}
