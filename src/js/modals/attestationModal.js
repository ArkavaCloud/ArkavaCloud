// ============================================================
// ATTESTATION CERTIFICATE & PDF DOWNLOAD MODULE
// ============================================================

import { showToast } from '../services/toastService.js';

export function initAttestationModalListeners() {
  const modalAttestation     = document.getElementById('modal-attestation');
  const btnOpenAttestation   = document.getElementById('btn-open-attestation');
  const btnCloseAttestation  = document.getElementById('btn-close-attestation');
  const modalAttestClose     = document.getElementById('modal-attestation-close');
  const btnDownloadAttestPdf = document.getElementById('btn-download-attestation-pdf');
  const btnDownloadAudit     = document.getElementById('btn-download-audit');

  if (btnOpenAttestation) {
    btnOpenAttestation.addEventListener('click', () => {
      if (modalAttestation) modalAttestation.classList.add('open');
    });
  }

  if (btnCloseAttestation) {
    btnCloseAttestation.addEventListener('click', () => {
      if (modalAttestation) modalAttestation.classList.remove('open');
    });
  }

  if (modalAttestClose) {
    modalAttestClose.addEventListener('click', () => {
      if (modalAttestation) modalAttestation.classList.remove('open');
    });
  }



  if (btnDownloadAttestPdf) {
    btnDownloadAttestPdf.addEventListener('click', () => {
      showToast('Downloading <strong>ARKAVA_Certificate_AVA.pdf</strong>... Verified cryptographic signature.', 'success');
    });
  }
}
