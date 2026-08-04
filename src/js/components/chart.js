// ============================================================
// DYNAMIC SVG CHART COMPONENT
// ============================================================

export function drawDynamicChart(svgId, timeframe = '1D') {
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

export function initTimeframeListeners() {
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
}
