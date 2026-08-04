// ============================================================
// UNIVERSAL MODAL MANAGER MODULE
// ============================================================

export function initModalManager() {
  const modalTokenomics    = document.getElementById('modal-tokenomics');
  const modalProspectus    = document.getElementById('modal-prospectus');
  const modalAudit         = document.getElementById('modal-audit');
  const modalDocs          = document.getElementById('modal-docs');
  const modalContracts     = document.getElementById('modal-contracts');
  const modalGithub        = document.getElementById('modal-github');
  const modalChains        = document.getElementById('modal-chains');
  const modalPortfolio     = document.getElementById('modal-portfolio');
  const modalDividends     = document.getElementById('modal-dividends');
  const modalOracleTelemetry = document.getElementById('modal-oracle-telemetry');
  const modalAttestation  = document.getElementById('modal-attestation');
  const modalInsurance    = document.getElementById('modal-insurance');
  const modalFees         = document.getElementById('modal-fees');
  const modalTrade        = document.getElementById('modal-trade');
  const modalWallet       = document.getElementById('modal-wallet');
  const modalAssetDetail  = document.getElementById('modal-asset-detail');

  const modalWalletConnect = document.getElementById('modal-walletconnect');

  const closeMap = {
    'modal-tokenomics-close': modalTokenomics, 'btn-close-tokenomics': modalTokenomics,
    'modal-prospectus-close': modalProspectus, 'btn-close-prospectus': modalProspectus,
    'modal-audit-close':      modalAudit,      'btn-close-audit':      modalAudit,
    'modal-docs-close':       modalDocs,       'btn-close-docs':       modalDocs,
    'modal-contracts-close':  modalContracts,  'btn-close-contracts':  modalContracts,
    'modal-github-close':     modalGithub,     'btn-close-github':     modalGithub,
    'modal-chains-close':     modalChains,     'btn-close-chains':     modalChains,
    'modal-portfolio-close':  modalPortfolio,
    'modal-dividends-close':  modalDividends,  'btn-close-dividends':  modalDividends,
    'modal-telemetry-close':  modalOracleTelemetry, 'btn-close-telemetry': modalOracleTelemetry,
    'modal-attestation-close': modalAttestation, 'btn-close-attestation': modalAttestation,
    'modal-insurance-close':  modalInsurance,  'btn-close-insurance':  modalInsurance,
    'modal-fees-close':       modalFees,       'btn-close-fees':       modalFees,
    'modal-walletconnect-close': modalWalletConnect
  };

  Object.entries(closeMap).forEach(([id, modal]) => {
    const el = document.getElementById(id);
    if (el && modal) el.addEventListener('click', () => modal.classList.remove('open'));
  });

  window.addEventListener('click', e => {
    if (e.target === modalTrade)         if (modalTrade) modalTrade.classList.remove('open');
    if (e.target === modalWallet)        if (modalWallet) modalWallet.classList.remove('open');
    if (e.target === modalAssetDetail)   if (modalAssetDetail) modalAssetDetail.classList.remove('open');
    if (e.target === modalWalletConnect) if (modalWalletConnect) modalWalletConnect.classList.remove('open');

    [modalTokenomics, modalProspectus, modalAudit, modalDocs, modalContracts, modalGithub, modalChains, modalPortfolio, modalDividends, modalOracleTelemetry, modalAttestation, modalInsurance, modalFees, modalWalletConnect]
      .forEach(m => { if (m && e.target === m) m.classList.remove('open'); });
  });

  // ESC key listener to close modals
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }
  });
}
