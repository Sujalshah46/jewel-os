import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCatalogQuote, calculateOldMetalQuote } from '../server/pricing.js';
const item={grossWeightMg:8000,netWeightMg:7900,ratePerGramPaise:660024,makingChargeType:'per_gram',makingChargeValue:50000,makingDiscountBps:0,stoneValuePaise:0,hallmarkChargePaise:4500,otherChargesPaise:0,itemDiscountPaise:0,gstRateBps:300};
test('server integer pricing matches independent metal/making/tax fixture and honors zero tax',()=>{
 assert.deepEqual(calculateCatalogQuote(item),{taxableAmountPaise:5618690,cgstPaise:84281,sgstPaise:84280,totalPricePaise:5787251});
 assert.equal(calculateCatalogQuote({...item,gstRateBps:0}).totalPricePaise,5618690);
 assert.equal(calculateCatalogQuote({...item,netWeightMg:1,grossWeightMg:1,ratePerGramPaise:500,makingChargeValue:0,hallmarkChargePaise:0,gstRateBps:0}).totalPricePaise,1);
});
test('fixed and percentage making charges apply their own unit and discount basis',()=>{
 assert.equal(calculateCatalogQuote({...item,makingChargeType:'fixed',makingChargeValue:10000,makingDiscountBps:2500,gstRateBps:0}).totalPricePaise,5226190);
 assert.equal(calculateCatalogQuote({...item,makingChargeType:'percentage',makingChargeValue:1000,makingDiscountBps:5000,gstRateBps:0}).totalPricePaise,5479400);
});
test('exchange valuation and exact-money overflow boundaries are explicit',()=>{
 assert.deepEqual(calculateOldMetalQuote({grossWeightMg:5000,lessWeightMg:500,purityBps:8200,baseRatePaisePerGram:720000,deductionPaisePerGram:0}),{netWeightMg:4500,fineWeightMg:3690,effectiveRatePaisePerGram:590400,valuationPaise:2656800});
 assert.throws(()=>calculateCatalogQuote({...item,ratePerGramPaise:Number.MAX_SAFE_INTEGER}),RangeError);
 assert.throws(()=>calculateCatalogQuote({...item,makingDiscountBps:10001}),RangeError);
});
