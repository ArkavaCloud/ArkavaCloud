// ============================================================
// ARKAVA PROTOCOL CONFIGURATION & REGISTRY DATA
// ============================================================

export const CORS_PROXY = 'https://api.allorigins.win/get?url=';

export const YAHOO_MAP = {
  aAAPL: 'AAPL',
  aNVDA: 'NVDA',
  aCOIN: 'COIN',
  aTSLA: 'TSLA',
  aMSFT: 'MSFT',
  aCSPX: 'SPY',
  aIB01: 'SHV',
  aHYG: 'HYG',
};

export const CONTRACT_ADDRESSES = {
  $AVA: '0xAVA5050a2D6489a74073581729013098520x99bb',
  aAAPL: '0x3918a9Bf3900a892b11295A6E8203c988942b012',
  aNVDA: '0x78a0A7569e2c6081e7d825c9388B9761e0b5103c',
  aCOIN: '0x19260Q10769a74073581729013098520x43a88b1e',
  aTSLA: '0x88160R10149a74073581729013098520x9923a100',
  aMSFT: '0x59491810459a74073581729013098520x11bb2001',
  aCSPX: '0x00B5BMR0879a74073581729013098520x33cc4002',
  aIB01: '0x00B1FZS3509a74073581729013098520x55dd6003',
  aHYG: '0x4642885135a74073581729013098520x77ee8004',
  factory: '0x5050a2D6489a74073581729013098520x43a88b1e',
  oracle: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
  dividends: '0x8f319201a40974073581729013098520x11aa'
};

export const PRESALE_CONFIG = {
  stage: 1,
  stageName: 'Phase 1: Early Bird Public Pre-Sale',
  tokenSymbol: '$AVA',
  tokenName: 'Arkava Governance & Utility Token',
  presalePrice: 0.0005,
  listingPrice: 0.0015,
  earlyBirdBonusPct: 5,
  targetRaised: 500000,
  currentRaised: 392450,
  contractAddress: CONTRACT_ADDRESSES.$AVA,
  endDateISO: '2026-08-06T13:00:00Z' // Thursday 13:00 UTC (= 20:00 UTC) Auto-Close
};

export const ASSETS = [
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
