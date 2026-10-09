// Jewellery Calculation Engine

export function calculateJewelleryItem({
  grossWeight = 0,
  lessWeight = 0,
  purityPercent = 91.67, // 22K default
  wastagePercent = 0,
  customerWastagePercent = 0,
  ratePerGram = 6600.24, // Rate per gram for selected purity
  makingChargeType = 'per_gram', // 'per_gram', 'fixed', 'percentage'
  makingChargeValue = 500, // e.g., 500 per gm
  makingDiscountPercent = 0,
  otherCharges = 0,
  hallmarkCharge = 45, // BIS hallmark fee
  diamondWeightCarats = 0,
  diamondRatePerCarat = 0,
  stoneValue = 0,
  itemDiscount = 0,
  gstRatePercent = 3.0 // Standard jewellery GST 3% (1.5% CGST + 1.5% SGST)
}) {
  const gw = Number(grossWeight) || 0;
  const lw = Number(lessWeight) || 0;
  const nw = Math.max(0, gw - lw);
  const purity = Number(purityPercent) || 0;
  const wastage = Number(wastagePercent) || 0;
  
  // Fine Weight calculation
  const fineWeight = Number(((nw * purity) / 100).toFixed(3));
  
  // Metal Value
  const metalValue = Number((nw * Number(ratePerGram)).toFixed(2));

  // Making charges calculation
  let rawMakingCharge = 0;
  if (makingChargeType === 'per_gram') {
    rawMakingCharge = gw * Number(makingChargeValue);
  } else if (makingChargeType === 'percentage') {
    rawMakingCharge = (metalValue * Number(makingChargeValue)) / 100;
  } else {
    rawMakingCharge = Number(makingChargeValue);
  }

  // Making discount
  const makingDiscount = (rawMakingCharge * (Number(makingDiscountPercent) || 0)) / 100;
  const totalMakingCharges = Math.max(0, rawMakingCharge - makingDiscount);

  // Stone & Diamond Value
  const diamondVal = (Number(diamondWeightCarats) || 0) * (Number(diamondRatePerCarat) || 0);
  const totalStoneValue = Number(stoneValue || 0) + diamondVal;

  // Taxable Amount (Before GST)
  const baseAmount = metalValue + totalMakingCharges + Number(otherCharges) + Number(hallmarkCharge) + totalStoneValue;
  const taxableAmount = Number(Math.max(0, baseAmount - (Number(itemDiscount) || 0)).toFixed(2));

  // GST Calculation (3% total: 1.5% CGST + 1.5% SGST)
  const taxRate = Number(gstRatePercent ?? 3);
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new Error('GST rate must be between 0 and 100.');
  }
  const gstPaise = Math.round(Number(((taxableAmount * taxRate) / 100).toFixed(2)) * 100);
  // Round CGST half-up to a paisa, then allocate the residual to SGST.
  const cgstPaise = Math.round(gstPaise / 2);
  const gstAmount = gstPaise / 100;
  const cgst = cgstPaise / 100;
  const sgst = (gstPaise - cgstPaise) / 100;

  // Final Value
  const finalValue = Number((taxableAmount + gstAmount).toFixed(2));

  return {
    grossWeight: Number(gw.toFixed(3)),
    lessWeight: Number(lw.toFixed(3)),
    netWeight: Number(nw.toFixed(3)),
    fineWeight,
    purityPercent: purity,
    wastagePercent: wastage,
    metalValue,
    totalMakingCharges: Number(totalMakingCharges.toFixed(2)),
    makingDiscount: Number(makingDiscount.toFixed(2)),
    totalStoneValue: Number(totalStoneValue.toFixed(2)),
    hallmarkCharge: Number(hallmarkCharge),
    otherCharges: Number(otherCharges),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    cgst,
    sgst,
    gstAmount,
    finalValue
  };
}

// Old Metal (Gold/Silver Exchange) Calculation
export function calculateOldMetalExchange({
  metalType = 'Gold',
  grossWeight = 0,
  lessWeight = 0, // Dust, stones, lac
  touchPercent = 85.0, // Purity test / tunch %
  currentBaseRate = 7200, // 24K per gram base rate
  rateDeductionPerGram = 0 // Melting / testing deduction
}) {
  const gw = Number(grossWeight) || 0;
  const lw = Number(lessWeight) || 0;
  const nw = Math.max(0, gw - lw);
  const touch = Number(touchPercent) || 0;

  // Fine metal calculated
  const fineWeight = Number(((nw * touch) / 100).toFixed(3));
  
  // Rate applied (base 24k rate * touch / 100) minus deduction
  const effectiveRatePerGram = Math.max(0, ((Number(currentBaseRate) * touch) / 100) - Number(rateDeductionPerGram));
  const valuation = Number((nw * effectiveRatePerGram).toFixed(2));

  return {
    grossWeight: Number(gw.toFixed(3)),
    lessWeight: Number(lw.toFixed(3)),
    netWeight: Number(nw.toFixed(3)),
    touchPercent: touch,
    fineWeight,
    effectiveRatePerGram: Number(effectiveRatePerGram.toFixed(2)),
    valuation
  };
}

// Loan / Girvi Interest Calculation
export function calculateGirviInterest({
  principalAmount = 0,
  monthlyRoiPercent = 1.5, // 1.5% per month
  startDateStr,
  endDateStr = new Date().toISOString().split('T')[0]
}) {
  const principal = Number(principalAmount) || 0;
  const roi = Number(monthlyRoiPercent) || 0;
  
  if (!startDateStr) {
    return { days: 0, months: 0, interestAmount: 0, totalPayable: principal };
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.max(0, end - start);
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Monthly interest with daily pro-rata or full month rounding
  const months = Number((days / 30).toFixed(2));
  const interestAmount = Number(((principal * (roi / 100) * days) / 30).toFixed(2));
  const totalPayable = Number((principal + interestAmount).toFixed(2));

  return {
    days,
    months,
    interestAmount,
    totalPayable
  };
}

export function safeEvaluateMath(expr) {
  if (!expr || typeof expr !== 'string') return 0;
  const tokens = expr.match(/(\d+(\.\d+)?|[+\-*/()])/g);
  if (!tokens || tokens.length === 0) return 0;

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parsePrimary() {
    const t = peek();
    if (t === '(') {
      consume();
      const val = parseExpression();
      if (peek() === ')') consume();
      return val;
    }
    if (t === '+' || t === '-') {
      const sign = consume() === '-' ? -1 : 1;
      return sign * parsePrimary();
    }
    const num = parseFloat(consume());
    if (Number.isNaN(num)) throw new Error('Invalid number');
    return num;
  }

  function parseTerm() {
    let val = parsePrimary();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const next = parsePrimary();
      if (op === '*') val *= next;
      else {
        if (next === 0) throw new Error('Division by zero');
        val /= next;
      }
    }
    return val;
  }

  function parseExpression() {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const next = parseTerm();
      if (op === '+') val += next;
      else val -= next;
    }
    return val;
  }

  const result = parseExpression();
  if (pos < tokens.length) throw new Error('Syntax error');
  return Number.isFinite(result) ? result : 0;
}
