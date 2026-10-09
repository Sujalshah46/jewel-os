// Exact integer paise, milligrams and basis points. Round each posted component
// half-up; GST is rounded once and its residual allocated to SGST.
const integer = value => {
  if (!((typeof value === 'number' && Number.isSafeInteger(value)) || (typeof value === 'string' && /^\d+$/.test(value)))) throw new RangeError('Invalid pricing integer.');
  const result = BigInt(value);
  if (result < 0n || result > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Pricing integer outside supported range.');
  return result;
};
const round = (numerator, denominator) => (numerator + denominator / 2n) / denominator;
const number = value => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('Pricing result exceeds exact-money range.');
  return Number(value);
};

export function calculateCatalogQuote(input) {
  const gross = integer(input.grossWeightMg), net = integer(input.netWeightMg);
  const rate = integer(input.ratePerGramPaise), making = integer(input.makingChargeValue);
  const discount = integer(input.makingDiscountBps), gstRate = integer(input.gstRateBps);
  if (net > gross || discount > 10000n || gstRate > 10000n) throw new RangeError('Invalid pricing proportions.');
  const metal = round(net * rate, 1000n);
  let makingNumerator, makingDenominator;
  if (input.makingChargeType === 'per_gram') { makingNumerator = gross * making; makingDenominator = 1000n; }
  else if (input.makingChargeType === 'percentage' && making <= 10000n) { makingNumerator = metal * making; makingDenominator = 10000n; }
  else if (input.makingChargeType === 'fixed') { makingNumerator = making; makingDenominator = 1n; }
  else throw new RangeError('Unsupported making charge method.');
  const makingTotal = round(makingNumerator * (10000n - discount), makingDenominator * 10000n);
  const base = metal + makingTotal + integer(input.stoneValuePaise) + integer(input.hallmarkChargePaise) + integer(input.otherChargesPaise);
  const itemDiscount = integer(input.itemDiscountPaise);
  if (itemDiscount > base) throw new RangeError('Discount exceeds price.');
  const taxable = base - itemDiscount;
  const gst = round(taxable * gstRate, 10000n), cgst = round(gst, 2n);
  return { taxableAmountPaise: number(taxable), cgstPaise: number(cgst), sgstPaise: number(gst - cgst), totalPricePaise: number(taxable + gst) };
}

export function calculateOldMetalQuote(input) {
  const gross = integer(input.grossWeightMg), less = integer(input.lessWeightMg), purity = integer(input.purityBps);
  const base = integer(input.baseRatePaisePerGram), deduction = integer(input.deductionPaisePerGram);
  if (less >= gross || purity === 0n || purity > 10000n) throw new RangeError('Invalid exchange weights or purity.');
  const net = gross - less, rateNumerator = base * purity - deduction * 10000n;
  const effective = rateNumerator > 0n ? rateNumerator : 0n;
  return { netWeightMg: number(net), fineWeightMg: number(round(net * purity, 10000n)),
    effectiveRatePaisePerGram: number(round(effective, 10000n)), valuationPaise: number(round(net * effective, 10000000n)) };
}
