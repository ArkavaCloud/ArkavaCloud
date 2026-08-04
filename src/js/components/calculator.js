// ============================================================
// YIELD COMPOUND CALCULATOR COMPONENT
// ============================================================

export function initCalculator() {
  const calcPrincipalSlider  = document.getElementById('calc-principal-slider');
  const calcPrincipalDisplay = document.getElementById('calc-principal-display');
  const calcYearsSlider      = document.getElementById('calc-years-slider');
  const calcYearsDisplay     = document.getElementById('calc-years-display');
  const calcAssetSelect      = document.getElementById('calc-asset-select');
  const calcTotalResult      = document.getElementById('calc-total-result');
  const calcYieldEarned      = document.getElementById('calc-yield-earned');
  const calcBankResult       = document.getElementById('calc-bank-result');
  const calcOutperformance   = document.getElementById('calc-outperformance');

  function updateCalculatorMath() {
    if (!calcPrincipalSlider || !calcYearsSlider || !calcAssetSelect) return;
    const principal = parseFloat(calcPrincipalSlider.value);
    const years     = parseFloat(calcYearsSlider.value);
    const rate      = parseFloat(calcAssetSelect.value);

    if (calcPrincipalDisplay) calcPrincipalDisplay.textContent = `$${principal.toLocaleString()}`;
    if (calcYearsDisplay)     calcYearsDisplay.textContent = `${years} Year${years > 1 ? 's' : ''}`;

    const futureValue   = principal * Math.pow(1 + rate, years);
    const yieldEarned   = futureValue - principal;
    const bankFuture    = principal * Math.pow(1.001, years);
    const outperform    = futureValue - bankFuture;

    if (calcTotalResult)    calcTotalResult.textContent    = `$${Math.round(futureValue).toLocaleString()} USD`;
    if (calcYieldEarned)    calcYieldEarned.textContent    = `+$${Math.round(yieldEarned).toLocaleString()} USD`;
    if (calcBankResult)     calcBankResult.textContent     = `$${Math.round(bankFuture).toLocaleString()} USD`;
    if (calcOutperformance) calcOutperformance.textContent = `+$${Math.round(outperform).toLocaleString()} USD`;
  }

  if (calcPrincipalSlider) calcPrincipalSlider.addEventListener('input', updateCalculatorMath);
  if (calcYearsSlider)     calcYearsSlider.addEventListener('input', updateCalculatorMath);
  if (calcAssetSelect)     calcAssetSelect.addEventListener('change', updateCalculatorMath);
  updateCalculatorMath();
}
