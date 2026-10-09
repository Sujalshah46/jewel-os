import { calculateJewelleryItem } from './calculations.js';

export function createBillingCartItem(stockItem, id = `cart-${stockItem.id}`) {
  const calc = calculateJewelleryItem({
    grossWeight: stockItem.grossWeight,
    lessWeight: stockItem.lessWeight,
    purityPercent: stockItem.purityPercent,
    ratePerGram: stockItem.ratePerGram,
    makingChargeType: stockItem.makingChargeType || 'per_gram',
    makingChargeValue: stockItem.makingChargeValue || 0,
    stoneValue: stockItem.stoneValue || 0,
    hallmarkCharge: stockItem.hallmarkCharge ?? 45,
    otherCharges: stockItem.otherCharges || 0,
    itemDiscount: 0
  });
  const cataloguePrice = Number(stockItem.totalPrice);
  const finalValue = Number.isFinite(cataloguePrice) ? cataloguePrice : calc.finalValue;

  return {
    id,
    itemId: stockItem.id,
    metalType: stockItem.metalType,
    itemCode: stockItem.itemCode,
    description: `${stockItem.category || ''} - ${stockItem.subCategory || ''}`.trim(),
    hsn: stockItem.hsn || '7113',
    qty: 1,
    grossWeight: Number(stockItem.grossWeight) || 0,
    lessWeight: Number(stockItem.lessWeight) || 0,
    netWeight: calc.netWeight,
    purityKarat: stockItem.purityKarat,
    purityPercent: Number(stockItem.purityPercent) || 0,
    wastagePercent: Number(stockItem.wastagePercent) || 5,
    finePurityPercent: Number(stockItem.purityPercent) || 0,
    customerWastagePercent: Number(stockItem.wastagePercent) || 5,
    fineWeight: calc.fineWeight,
    ratePerGram: Number(stockItem.ratePerGram) || 0,
    ratePer10Gm: (Number(stockItem.ratePerGram) || 0) * 10,
    makingChargeType: stockItem.makingChargeType || 'per_gram',
    makingChargeValue: Number(stockItem.makingChargeValue) || 0,
    makingDiscountPercent: 0,
    totalMakingCharges: calc.totalMakingCharges,
    stoneValue: Number(stockItem.stoneValue) || 0,
    hallmarkCharge: Number(stockItem.hallmarkCharge ?? 45),
    otherCharges: Number(stockItem.otherCharges) || 0,
    itemDiscount: 0,
    taxableAmount: calc.taxableAmount,
    cgst: calc.cgst,
    sgst: calc.sgst,
    finalValue,
    status: 'Ready'
  };
}

export function addStockItemToCart(cart, stockItem) {
  if (!stockItem || stockItem.status !== 'In Stock' || cart.some(item => item.itemId === stockItem.id)) return cart;
  return [...cart, createBillingCartItem(stockItem)];
}

export function createCatalogueEstimate(item) {
  const price = Number(item.totalPrice ?? 0);
  const amount = Number.isFinite(price) ? price : 0;
  return { items: [{ ...item, finalValue: amount }], total: amount };
}
