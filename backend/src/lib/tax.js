/**
 * BIR Withholding Tax Computation
 * Based on TRAIN Law (RA 10963) - Revised Withholding Tax Table
 * Effective January 1, 2018 onwards
 * 
 * For Monthly Payroll Period (2024-2025 rates)
 */

// Monthly tax table (2024-2025)
// Based on BIR Revenue Regulations No. 11-2018
const MONTHLY_TAX_TABLE = [
  // { min, max, baseTax, rate, overAmount }
  { min: 0, max: 20832, baseTax: 0, rate: 0, overAmount: 0 },
  { min: 20833, max: 33332, baseTax: 0, rate: 0.20, overAmount: 20833 },
  { min: 33333, max: 66666, baseTax: 2500, rate: 0.25, overAmount: 33333 },
  { min: 66667, max: 166666, baseTax: 10833, rate: 0.30, overAmount: 66667 },
  { min: 166667, max: 666666, baseTax: 40833, rate: 0.32, overAmount: 166667 },
  { min: 666667, max: Infinity, baseTax: 200833, rate: 0.35, overAmount: 666667 },
];

/**
 * Compute withholding tax based on taxable income (monthly)
 * @param {number} taxableIncome - Monthly taxable income
 * @returns {number} Withholding tax amount
 */
export function computeWithholdingTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  
  const income = Number(taxableIncome);
  
  for (const bracket of MONTHLY_TAX_TABLE) {
    if (income >= bracket.min && income <= bracket.max) {
      const excess = income - bracket.overAmount;
      const tax = bracket.baseTax + (excess * bracket.rate);
      return Math.round(tax * 100) / 100; // Round to 2 decimal places
    }
  }
  
  // Fallback for very high income (should not reach here with Infinity max)
  const topBracket = MONTHLY_TAX_TABLE[MONTHLY_TAX_TABLE.length - 1];
  const excess = income - topBracket.overAmount;
  return Math.round((topBracket.baseTax + excess * topBracket.rate) * 100) / 100;
}

/**
 * Compute annual withholding tax (for 13th month, year-end)
 * @param {number} annualTaxableIncome - Annual taxable income
 * @returns {number} Annual withholding tax
 */
export function computeAnnualWithholdingTax(annualTaxableIncome) {
  if (annualTaxableIncome <= 0) return 0;
  
  const income = Number(annualTaxableIncome);
  
  // Annual tax table (TRAIN Law)
  const ANNUAL_TAX_TABLE = [
    { min: 0, max: 250000, baseTax: 0, rate: 0, overAmount: 0 },
    { min: 250001, max: 400000, baseTax: 0, rate: 0.20, overAmount: 250000 },
    { min: 400001, max: 800000, baseTax: 30000, rate: 0.25, overAmount: 400000 },
    { min: 800001, max: 2000000, baseTax: 130000, rate: 0.30, overAmount: 800000 },
    { min: 2000001, max: 8000000, baseTax: 490000, rate: 0.32, overAmount: 2000000 },
    { min: 8000001, max: Infinity, baseTax: 2410000, rate: 0.35, overAmount: 8000000 },
  ];
  
  for (const bracket of ANNUAL_TAX_TABLE) {
    if (income >= bracket.min && income <= bracket.max) {
      const excess = income - bracket.overAmount;
      const tax = bracket.baseTax + (excess * bracket.rate);
      return Math.round(tax * 100) / 100;
    }
  }
  
  const topBracket = ANNUAL_TAX_TABLE[ANNUAL_TAX_TABLE.length - 1];
  const excess = income - topBracket.overAmount;
  return Math.round((topBracket.baseTax + excess * topBracket.rate) * 100) / 100;
}

/**
 * Compute taxable income after deductions
 * @param {number} grossPay - Gross pay
 * @param {number} totalDeductions - Total deductions (SSS, PhilHealth, Pag-IBIG, etc.)
 * @returns {number} Taxable income
 */
export function computeTaxableIncome(grossPay, totalDeductions) {
  const taxable = Number(grossPay) - Number(totalDeductions);
  return taxable > 0 ? taxable : 0;
}

/**
 * Get tax bracket info for reporting
 * @param {number} taxableIncome - Monthly taxable income
 * @returns {object} Bracket info
 */
export function getTaxBracketInfo(taxableIncome) {
  const income = Number(taxableIncome);
  
  for (const bracket of MONTHLY_TAX_TABLE) {
    if (income >= bracket.min && income <= bracket.max) {
      return {
        bracket: `${bracket.min} - ${bracket.max === Infinity ? 'Above' : bracket.max}`,
        baseTax: bracket.baseTax,
        rate: (bracket.rate * 100).toFixed(1) + '%',
        overAmount: bracket.overAmount,
      };
    }
  }
  
  return null;
}

/**
 * Compute deduction amount for TABLE type (withholding tax)
 * This is used when a deduction has amountType: 'TABLE'
 * @param {object} params - Parameters
 * @param {number} params.grossPay - Gross pay
 * @param {number} params.totalDeductions - Total non-tax deductions
 * @returns {number} Withholding tax amount
 */
export function computeTableDeduction({ grossPay, totalDeductions }) {
  const taxableIncome = computeTaxableIncome(grossPay, totalDeductions);
  return computeWithholdingTax(taxableIncome);
}