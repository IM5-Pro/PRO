const DEFAULT_INDIA_TAX_SLABS = [
  { upto: 300000, rate: 0 },
  { upto: 600000, rate: 0.05 },
  { upto: 900000, rate: 0.1 },
  { upto: 1200000, rate: 0.15 },
  { upto: 1500000, rate: 0.2 },
  { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
];

const toAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    return 0;
  }
  return num;
};

const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculateTaxBySlabs = (annualTaxableIncome, slabs = DEFAULT_INDIA_TAX_SLABS) => {
  const taxableIncome = toAmount(annualTaxableIncome);
  const breakdown = [];

  let remaining = taxableIncome;
  let lowerBound = 0;
  let totalTax = 0;

  for (const slab of slabs) {
    if (remaining <= 0) {
      break;
    }

    const slabCap = Number(slab.upto);
    const slabRate = Number(slab.rate) || 0;
    const slabWidth = slabCap === Number.POSITIVE_INFINITY ? remaining : Math.max(0, slabCap - lowerBound);
    const taxableInSlab = Math.min(remaining, slabWidth);
    const slabTax = taxableInSlab * slabRate;

    breakdown.push({
      from: lowerBound,
      to: slabCap,
      taxableAmount: roundCurrency(taxableInSlab),
      rate: slabRate,
      tax: roundCurrency(slabTax),
    });

    totalTax += slabTax;
    remaining -= taxableInSlab;
    lowerBound = slabCap;
  }

  const annualTax = roundCurrency(totalTax);

  return {
    taxableIncome: roundCurrency(taxableIncome),
    annualTax,
    monthlyTax: roundCurrency(annualTax / 12),
    slabs: breakdown,
  };
};

const calculateMonthlyTaxFromAnnualIncome = (annualTaxableIncome, slabs = DEFAULT_INDIA_TAX_SLABS) => {
  return calculateTaxBySlabs(annualTaxableIncome, slabs).monthlyTax;
};

export {
  DEFAULT_INDIA_TAX_SLABS,
  calculateTaxBySlabs,
  calculateMonthlyTaxFromAnnualIncome,
};
