// ============================================================
// ARKAVA PROTOCOL — MAIN ES6 BOOTSTRAP MODULE
// ============================================================

import { ASSETS } from './config.js';
import { showToast } from './services/toastService.js';
import { refreshAllPrices, startPriceTickSimulation } from './services/priceService.js';
import {
  walletState,
  connectWallet,
  finalizeWalletConnection,
  disconnectWallet,
  claimTestnetFaucet,
  importTokenToWallet,
  requireWalletConnection,
  updatePortfolioUI,
  autoConnectLastWallet
} from './services/walletService.js';

import { drawDynamicChart, initTimeframeListeners } from './components/chart.js';
import { renderAssetTable, initAssetTableFilters } from './components/assetTable.js';
import { initCalculator } from './components/calculator.js';
import { initLiquidityStream } from './components/stream.js';

import { initModalManager } from './modals/modalManager.js';
import { openTradeModal, initTradeModalListeners, updateTradeModalMath } from './modals/tradeModal.js';
import { initAttestationModalListeners } from './modals/attestationModal.js';
import { initPresaleEngine } from './components/presale.js';
import { initTypewriterScroll } from './components/typewriter.js';

let simMode = 'mint';
let currentDetailSymbol = 'aAAPL';

function openAssetDetailModal(symbol = 'aAAPL') {
  const modalAssetDetail = document.getElementById('modal-asset-detail');
  if (!modalAssetDetail) return;
  const asset = ASSETS.find(a => a.symbol === symbol) || ASSETS[0];
  currentDetailSymbol = asset.symbol;

  const nameEl = document.getElementById('modal-asset-name');
  const isinEl = document.getElementById('modal-asset-isin');
  const undEl = document.getElementById('modal-asset-underlier');
  const yieldEl = document.getElementById('modal-asset-yield');
  const priceEl = document.getElementById('modal-asset-price');
  const iconEl = document.getElementById('modal-asset-icon');

  if (nameEl) nameEl.textContent = asset.symbol;
  if (isinEl) isinEl.textContent = `ISIN: ${asset.isin}`;
  if (undEl) undEl.textContent = asset.underlier;
  if (yieldEl) yieldEl.textContent = asset.yield;
  if (priceEl) priceEl.textContent = `$${asset.price.toFixed(2)} USD`;
  if (iconEl) {
    iconEl.style.backgroundColor = asset.iconBg;
    iconEl.style.border = asset.border;
    iconEl.innerHTML = asset.logoSvg;
  }

  modalAssetDetail.classList.add('open');
}

function closeAssetDetailModal() {
  const modalAssetDetail = document.getElementById('modal-asset-detail');
  if (modalAssetDetail) modalAssetDetail.classList.remove('open');
}

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

function initSimulatorEngine() {
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
      const target = ASSETS.find(a => a.symbol === selectedToken) || ASSETS[0];
      const count = (val / target.price).toFixed(4);
      if (simOutputAmount) simOutputAmount.value = `${count} ${target.symbol}`;
      if (simUnderlyingPrice) simUnderlyingPrice.textContent = `$${target.price.toFixed(2)} USD`;
      if (simNetAmount) simNetAmount.textContent = `${count} ${target.symbol}`;
    } else {
      const selectedToken = simInputCurrency.value || 'aAAPL';
      const selectedFiat = simOutputCurrency.value || 'USD';
      const target = ASSETS.find(a => a.symbol === selectedToken) || ASSETS[0];
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

  const btnSimMax = document.getElementById('btn-sim-max');
  if (btnSimMax) {
    btnSimMax.addEventListener('click', () => {
      if (!walletState.isConnected) {
        requireWalletConnection('using MAX deposit amount');
        return;
      }
      if (simInputAmount) {
        simInputAmount.value = walletState.portfolio.cashUsd.toFixed(2);
        updateSimulatorMath();
      }
    });
  }

  if (btnExecuteSim) {
    btnExecuteSim.addEventListener('click', () => {
      if (!requireWalletConnection('executing mint or redeem simulations')) return;
      if (simMode === 'mint') {
        const payCurrency = simInputCurrency?.value || 'USD';
        const val = parseFloat(simInputAmount?.value) || 1000;
        const selectedToken = simOutputCurrency?.value || 'aAAPL';
        const target = ASSETS.find(a => a.symbol === selectedToken) || ASSETS[0];

        if (val > walletState.portfolio.cashUsd) {
          showToast(`Insufficient tUSDC balance ($${walletState.portfolio.cashUsd.toFixed(2)} available). Click 'Claim 10,000 tUSDC Testnet Faucet' in your Profile Menu first.`, 'warning', 8000);
          const modalProfile = document.getElementById('modal-profile');
          if (modalProfile) modalProfile.classList.add('open');
          return;
        }

        const sharesBought = val / target.price;
        let existing = walletState.portfolio.holdings.find(h => h.symbol === target.symbol);
        if (existing) {
          existing.shares += sharesBought;
        } else {
          walletState.portfolio.holdings.push({ symbol: target.symbol, shares: sharesBought, buyPrice: target.price });
        }

        walletState.portfolio.cashUsd = Math.max(0, walletState.portfolio.cashUsd - val);
        updatePortfolioUI();
        showToast(
          `Mint simulation: <strong>${simOutputAmount?.value}</strong> for $${simInputAmount?.value} ${payCurrency}. Collateral verified 1:1 in Swissquote custody.`,
          'success', 6000
        );
      } else {
        const burnToken = simInputCurrency?.value || 'aAAPL';
        const simVal = parseFloat(simInputAmount?.value) || 0;
        const redeemAsset = ASSETS.find(a => a.symbol === burnToken) || ASSETS[0];

        let existing = walletState.portfolio.holdings.find(h => h.symbol === burnToken);
        if (!existing || existing.shares < simVal) {
          showToast(`Insufficient ${burnToken} token balance to redeem.`, 'warning');
          return;
        }

        existing.shares = Math.max(0, existing.shares - simVal);
        walletState.portfolio.cashUsd += simVal * redeemAsset.price;
        updatePortfolioUI();
        showToast(
          `Redemption simulation: Burned <strong>${simInputAmount?.value} ${burnToken}</strong>. Payout of <strong>${simOutputAmount?.value}</strong> wired from Swissquote Bank to your wallet.`,
          'success', 7000
        );
      }
    });
  }

  return updateSimulatorMath;
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI & Components
  const updateSimMath = initSimulatorEngine();
  initCalculator();
  initModalManager();
  initTradeModalListeners();
  initAttestationModalListeners();
  initTimeframeListeners();
  initCounterAnimations();
  initLiquidityStream();
  initPresaleEngine();

  drawDynamicChart('hero-chart-svg', '1D');

  const onTableUpdate = () => {
    renderAssetTable(
      symbol => openTradeModal(symbol),
      symbol => openAssetDetailModal(symbol)
    );
  };

  onTableUpdate();
  initAssetTableFilters(onTableUpdate);

  // Top Scroll Progress Indicator
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / (height || 1)) * 100;
      progressBar.style.width = `${scrolled}%`;
    }, { passive: true });
  }

  // Scroll reveal
  document.querySelectorAll('section, .reveal-on-scroll').forEach(s => s.classList.add('reveal-on-scroll'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal-on-scroll').forEach(s => observer.observe(s));

  // Triggers
  const heroBtnTrade = document.getElementById('hero-btn-trade-trigger');
  const widgetBtnMint = document.getElementById('widget-btn-mint');
  const widgetBtnDetails = document.getElementById('widget-btn-details');

  if (heroBtnTrade) heroBtnTrade.addEventListener('click', () => openTradeModal('aAAPL'));
  if (widgetBtnMint) widgetBtnMint.addEventListener('click', () => openTradeModal('aAAPL'));
  if (widgetBtnDetails) widgetBtnDetails.addEventListener('click', () => openAssetDetailModal('aAAPL'));

  const modalBtnOpenTerminal = document.getElementById('modal-btn-open-terminal');
  if (modalBtnOpenTerminal) {
    modalBtnOpenTerminal.addEventListener('click', () => {
      closeAssetDetailModal();
      openTradeModal(currentDetailSymbol);
    });
  }

  const modalAssetClose = document.getElementById('modal-asset-close');
  const modalBtnCloseAction = document.getElementById('modal-btn-close-action');
  if (modalAssetClose) modalAssetClose.addEventListener('click', closeAssetDetailModal);
  if (modalBtnCloseAction) modalBtnCloseAction.addEventListener('click', closeAssetDetailModal);

  // Wallet Connect Triggers
  const modalWallet = document.getElementById('modal-wallet');
  const modalWalletConnect = document.getElementById('modal-walletconnect');
  const btnConnectWallet = document.getElementById('btn-connect-wallet');
  const btnConnectMobile = document.getElementById('btn-connect-wallet-mobile');
  const modalWalletClose = document.getElementById('modal-wallet-close');
  const modalWalletConnectClose = document.getElementById('modal-walletconnect-close');

  const btnCopyWcUri = document.getElementById('btn-copy-wc-uri');
  const btnSimulateWcConnect = document.getElementById('btn-simulate-wc-connect');
  const btnSwitchToExtension = document.getElementById('btn-switch-to-extension-modal');

  const openWcModal = () => {
    if (modalWallet) modalWallet.classList.remove('open');
    if (modalWalletConnect) modalWalletConnect.classList.add('open');
  };

  const openExtensionModal = () => {
    if (modalWalletConnect) modalWalletConnect.classList.remove('open');
    if (modalWallet) modalWallet.classList.add('open');
  };

  const modalProfile = document.getElementById('modal-profile');
  const handleConnectClick = () => {
    if (walletState.isConnected) {
      if (modalProfile) modalProfile.classList.add('open');
    } else {
      openWcModal();
    }
  };

  if (btnConnectWallet) btnConnectWallet.addEventListener('click', handleConnectClick);
  if (btnConnectMobile) btnConnectMobile.addEventListener('click', handleConnectClick);
  if (modalWalletClose) modalWalletClose.addEventListener('click', () => modalWallet?.classList.remove('open'));
  if (modalWalletConnectClose) modalWalletConnectClose.addEventListener('click', () => modalWalletConnect?.classList.remove('open'));
  if (btnSwitchToExtension) btnSwitchToExtension.addEventListener('click', openExtensionModal);

  document.querySelectorAll('.wallet-option-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const walletName = e.currentTarget.dataset.wallet || 'MetaMask';
      if (walletName === 'WalletConnect') {
        openWcModal();
      } else {
        connectWallet(walletName);
      }
    });
  });

  if (btnCopyWcUri) {
    btnCopyWcUri.addEventListener('click', () => {
      const fakeUri = 'wc:7f8a91b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8@2?relay-protocol=irn&symKey=99a8b7c6d5e4f3a2b1';
      navigator.clipboard.writeText(fakeUri).then(() => {
        showToast('WalletConnect URI copied to clipboard! Scan or paste into Trust Wallet / Rainbow App.', 'info');
      }).catch(() => {
        showToast('WalletConnect URI copied to clipboard!', 'info');
      });
    });
  }

  if (btnSimulateWcConnect) {
    btnSimulateWcConnect.addEventListener('click', () => {
      if (modalWalletConnect) modalWalletConnect.classList.remove('open');
      connectWallet('WalletConnect (Trust Wallet)');
    });
  }

  // Wallet Confirmation Modal Controls
  const modalWalletConfirm = document.getElementById('modal-wallet-confirm');
  const btnApproveConfirm = document.getElementById('btn-approve-wallet-confirm');
  const btnRejectConfirm = document.getElementById('btn-reject-wallet-confirm');
  const modalConfirmClose = document.getElementById('modal-wallet-confirm-close');

  if (btnApproveConfirm) btnApproveConfirm.addEventListener('click', finalizeWalletConnection);
  if (btnRejectConfirm) btnRejectConfirm.addEventListener('click', () => {
    if (modalWalletConfirm) modalWalletConfirm.classList.remove('open');
    showToast('Wallet connection request rejected by user.', 'info');
  });
  if (modalConfirmClose) modalConfirmClose.addEventListener('click', () => {
    if (modalWalletConfirm) modalWalletConfirm.classList.remove('open');
  });

  // Profile Modal Actions
  const btnProfileClose = document.getElementById('modal-profile-close');
  const btnProfileOpenPort = document.getElementById('btn-profile-open-portfolio');
  const btnProfileFaucet = document.getElementById('btn-profile-claim-faucet');
  const btnProfileCopyAddr = document.getElementById('btn-profile-copy-address');
  const btnProfileCopyRef = document.getElementById('btn-profile-copy-ref');
  const btnDisconnect = document.getElementById('btn-disconnect-wallet');

  if (btnProfileClose) btnProfileClose.addEventListener('click', () => modalProfile?.classList.remove('open'));
  if (btnProfileOpenPort) btnProfileOpenPort.addEventListener('click', () => {
    modalProfile?.classList.remove('open');
    const modalPortfolio = document.getElementById('modal-portfolio');
    if (modalPortfolio) modalPortfolio.classList.add('open');
  });
  if (btnProfileFaucet) btnProfileFaucet.addEventListener('click', claimTestnetFaucet);
  if (btnProfileCopyAddr) btnProfileCopyAddr.addEventListener('click', () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      showToast('Wallet address copied to clipboard!', 'info');
    }
  });
  if (btnProfileCopyRef) btnProfileCopyRef.addEventListener('click', () => {
    if (walletState.address) {
      navigator.clipboard.writeText(`https://arkava.cloud/?ref=${walletState.address}`);
      showToast('Referral link copied to clipboard!', 'success');
    }
  });
  if (btnDisconnect) btnDisconnect.addEventListener('click', disconnectWallet);

  const btnClaimFaucetNav = document.getElementById('btn-claim-faucet-nav');
  const btnWalletFaucet = document.getElementById('btn-wallet-faucet');
  if (btnClaimFaucetNav) btnClaimFaucetNav.addEventListener('click', claimTestnetFaucet);
  if (btnWalletFaucet) btnWalletFaucet.addEventListener('click', claimTestnetFaucet);

  // Portfolio modal actions
  const modalPortfolio = document.getElementById('modal-portfolio');
  const modalDividends = document.getElementById('modal-dividends');
  const btnOpenPortfolio = document.getElementById('btn-open-portfolio');
  const btnPortfolioTrade = document.getElementById('btn-portfolio-trade');
  const btnPortfolioDivs = document.getElementById('btn-portfolio-dividends');

  if (btnOpenPortfolio) btnOpenPortfolio.addEventListener('click', () => { if (modalPortfolio) modalPortfolio.classList.add('open'); });
  if (btnPortfolioTrade) btnPortfolioTrade.addEventListener('click', () => { if (modalPortfolio) modalPortfolio.classList.remove('open'); openTradeModal('aAAPL'); });
  if (btnPortfolioDivs) btnPortfolioDivs.addEventListener('click', () => { if (modalPortfolio) modalPortfolio.classList.remove('open'); if (modalDividends) modalDividends.classList.add('open'); });

  // EIP-747 Token import buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-import-token');
    if (btn) {
      const sym = btn.dataset.symbol || 'aAAPL';
      importTokenToWallet(sym);
    }
  });

  // Modal triggers (Insurance, Fees, Telemetry)
  const modalInsurance = document.getElementById('modal-insurance');
  const modalFees = document.getElementById('modal-fees');
  const modalOracleTelemetry = document.getElementById('modal-oracle-telemetry');
  const modalTokenomics = document.getElementById('modal-tokenomics');
  const modalProspectus = document.getElementById('modal-prospectus');
  const modalContracts = document.getElementById('modal-contracts');
  const modalGithub = document.getElementById('modal-github');
  const modalChains = document.getElementById('modal-chains');

  const btnOpenInsurance = document.getElementById('btn-open-insurance');
  const btnOpenInsurancePor = document.getElementById('btn-open-insurance-por');
  const btnOpenFees = document.getElementById('btn-open-fee-schedule');
  const btnOpenFeesPor = document.getElementById('btn-open-fees-por');
  const btnViewOracleData = document.getElementById('btn-view-oracle-data');
  const btnDownloadAudit = document.getElementById('btn-download-audit');

  if (btnOpenInsurance) btnOpenInsurance.addEventListener('click', () => { if (modalInsurance) modalInsurance.classList.add('open'); });
  if (btnOpenInsurancePor) btnOpenInsurancePor.addEventListener('click', () => { if (modalInsurance) modalInsurance.classList.add('open'); });
  if (btnOpenFees) btnOpenFees.addEventListener('click', () => { if (modalFees) modalFees.classList.add('open'); });
  if (btnOpenFeesPor) btnOpenFeesPor.addEventListener('click', () => { if (modalFees) modalFees.classList.add('open'); });
  if (btnViewOracleData) btnViewOracleData.addEventListener('click', () => { if (modalOracleTelemetry) modalOracleTelemetry.classList.add('open'); });
  if (btnDownloadAudit) btnDownloadAudit.addEventListener('click', () => { const modalAudit = document.getElementById('modal-audit'); if (modalAudit) modalAudit.classList.add('open'); });

  // Footer links
  const footerLinks = {
    'footer-link-insurance': modalInsurance,
    'footer-link-fees': modalFees,
    'footer-link-audit': document.getElementById('modal-attestation'),
    'footer-link-tokenomics': modalTokenomics,
    'footer-link-prospectus': modalProspectus,
    'footer-link-contracts': modalContracts,
    'footer-link-github': modalGithub,
    'footer-link-chains': modalChains
  };

  Object.entries(footerLinks).forEach(([id, modal]) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', e => {
        e.preventDefault();
        if (modal) modal.classList.add('open');
      });
    }
  });

  // Vault Deposit Buttons
  document.querySelectorAll('.btn-vault-deposit').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!requireWalletConnection('depositing into Yield Vaults')) return;
      const vaultName = e.currentTarget.dataset.vault;
      showToast(`Opening deposit for <strong>${vaultName}</strong>. Yield compounding active.`, 'success');
      openTradeModal('aAAPL');
    });
  });



  // Institutional form
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

  // Mobile Drawer
  const mobileDrawer = document.getElementById('mobile-drawer');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileDrawerClose = document.getElementById('mobile-drawer-close');
  if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', () => { if (mobileDrawer) mobileDrawer.classList.add('open'); });
  if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', () => { if (mobileDrawer) mobileDrawer.classList.remove('open'); });
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', () => { if (mobileDrawer) mobileDrawer.classList.remove('open'); });
  });

  // Auto connect last wallet from persistent storage if present
  autoConnectLastWallet();

  // Start tickers, price fetchers, & typewriter scroll engine
  initTypewriterScroll();
  refreshAllPrices(onTableUpdate);
  setInterval(() => refreshAllPrices(onTableUpdate), 60000);
  startPriceTickSimulation([onTableUpdate, updateSimMath, updateTradeModalMath]);
});
