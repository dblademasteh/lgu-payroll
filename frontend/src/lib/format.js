export function formatCurrency(amount, { fractionDigits = 0 } = {}) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: fractionDigits }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-PH').format(num);
}