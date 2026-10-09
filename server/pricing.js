import { calculateJewelleryItem, calculateOldMetalExchange } from '../src/utils/calculations.js';

export function calculateCatalogQuote(input) {
  const grossWeight = input.grossWeightMg / 1000;
  const netWeight = input.netWeightMg / 1000;
  const makingValue = input.makingChargeValue / 100;
  const result = calculateJewelleryItem({
    grossWeight,
    lessWeight: Math.max(0, grossWeight - netWeight),
    purityPercent: input.purityBps / 100,
    ratePerGram: input.ratePerGramPaise / 100,
    makingChargeType: input.makingChargeType,
    makingChargeValue: makingValue,
    makingDiscountPercent: input.makingDiscountBps / 100,
    stoneValue: input.stoneValuePaise / 100,
    hallmarkCharge: input.hallmarkChargePaise / 100,
    otherCharges: input.otherChargesPaise / 100,
    itemDiscount: input.itemDiscountPaise / 100,
    gstRatePercent: input.gstRateBps / 100,
  });
  return {
    taxableAmountPaise: Math.round(result.taxableAmount * 100),
    cgstPaise: Math.round(result.cgst * 100),
    sgstPaise: Math.round(result.sgst * 100),
    totalPricePaise: Math.round(result.finalValue * 100),
  };
}

export function calculateOldMetalQuote(input) {
  const result = calculateOldMetalExchange({
    metalType: input.metalType,
    grossWeight: input.grossWeightMg / 1000,
    lessWeight: input.lessWeightMg / 1000,
    touchPercent: input.purityBps / 100,
    currentBaseRate: input.baseRatePaisePerGram / 100,
    rateDeductionPerGram: input.deductionPaisePerGram / 100,
  });
  return {
    netWeightMg: Math.round(result.netWeight * 1000),
    fineWeightMg: Math.round(result.fineWeight * 1000),
    effectiveRatePaisePerGram: Math.round(result.effectiveRatePerGram * 100),
    valuationPaise: Math.round(result.valuation * 100),
  };
}
