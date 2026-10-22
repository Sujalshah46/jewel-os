/**
 * Automated Verification Suite for Hardware Drivers & Production Integrations
 * Tests:
 * 1. Electronic Digital Weighing Scale Parser (Essae, CAS, Phoenix, Mettler)
 * 2. ZPL-II Thermal Barcode / Tag Generation (Dumbbell 86x14mm & Butterfly 60x28mm)
 * 3. Dynamic NPCI UPI QR Code Engine & SVG Serializer
 */

import assert from 'node:assert';
import { parseScaleWeightString } from '../src/utils/weighingScaleParser.js';
import { generateDumbbellZpl, generateButterflyZpl } from '../src/utils/zplGenerator.js';
import { buildUpiPaymentUrl, generateQrMatrix, qrMatrixToSvg } from '../src/utils/qrCode.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

console.log('\n======================================================================');
console.log('JEWELLERY OS - HARDWARE & INTEGRATIONS AUDIT SUITE');
console.log('======================================================================\n');

// -------------------------------------------------------------------------
// 1. Electronic Weighing Scale Parser Tests
// -------------------------------------------------------------------------
console.log('--- 1. Testing Electronic Weighing Scale Serial Output Parser ---');

test('[SCALE-01] Essae DS-215 standard stable reading parsing', () => {
  const result = parseScaleWeightString('ST,GS,+0007.820g\r\n');
  assert.strictEqual(result.weight, 7.82, 'Weight should be 7.820g');
  assert.strictEqual(result.isStable, true, 'Reading should be marked stable');
  assert.strictEqual(result.unit, 'g');
});

test('[SCALE-02] CAS MW series unstable fluctuation reading parsing', () => {
  const result = parseScaleWeightString('US,NT, 12.450 g\n');
  assert.strictEqual(result.weight, 12.45, 'Weight should be 12.450g');
  assert.strictEqual(result.isStable, false, 'Reading should be marked unstable');
});

test('[SCALE-03] Heavy ornament scale reading in Kilograms automatically converted to Grams', () => {
  const result = parseScaleWeightString('ST,NT,  0.045 kg\r\n');
  assert.strictEqual(result.weight, 45, '0.045 kg should convert to 45.000g');
  assert.strictEqual(result.isStable, true);
});

test('[SCALE-04] Phoenix & Contech micro-balance format parsing', () => {
  const result = parseScaleWeightString('W:+0008.155g');
  assert.strictEqual(result.weight, 8.155, 'Weight should be 8.155g');
  assert.strictEqual(result.isStable, true);
});

test('[SCALE-05] Handling tare / negative / zero scale reading gracefully', () => {
  const zeroResult = parseScaleWeightString('ST,GS, 0.000 g');
  assert.strictEqual(zeroResult.weight, 0);

  const negResult = parseScaleWeightString('ST,GS,-0.050g');
  assert.strictEqual(negResult.weight, -0.05);

  const junkResult = parseScaleWeightString('');
  assert.strictEqual(junkResult.weight, 0);
  assert.strictEqual(junkResult.isStable, false);
});

// -------------------------------------------------------------------------
// 2. Thermal Tag ZPL Generation Tests
// -------------------------------------------------------------------------
console.log('\n--- 2. Testing Zebra Programming Language (ZPL) Tag Engine ---');

test('[ZPL-01] Dumbbell (Rat-tail) 86x14mm ZPL header and geometry constraints', () => {
  const zpl = generateDumbbellZpl({
    firmCode: 'KJJ',
    itemCode: 'LRING33',
    barcode: '1201',
    huid: 'HUID9942',
    purityKarat: '22K916',
    grossWeight: 7.9,
    netWeight: 7.2,
    makingCharge: 500,
    totalPrice: 57872
  });

  assert.ok(zpl.startsWith('^XA'), 'ZPL must start with ^XA');
  assert.ok(zpl.endsWith('^XZ'), 'ZPL must end with ^XZ');
  assert.ok(zpl.includes('^PW688'), 'Dumbbell tag width must be 688 dots (86mm)');
  assert.ok(zpl.includes('^LL112'), 'Dumbbell tag length must be 112 dots (14mm)');
  assert.ok(zpl.includes('LRING33'), 'ZPL must encode item code');
  assert.ok(zpl.includes('BAR: 1201'), 'ZPL must encode barcode');
  assert.ok(zpl.includes('HUID: HUID9942'), 'ZPL must encode HUID');
  assert.ok(zpl.includes('^FO580,12^BQN,2,3^FDQA,1201^FS'), 'ZPL must encode QR barcode block');
});

test('[ZPL-02] Butterfly 60x28mm Foldover Tag ZPL structure and center fold', () => {
  const zpl = generateButterflyZpl({
    firmName: 'Krishna Jewellers',
    itemCode: 'BNGL88',
    category: 'Bangles',
    barcode: '1088',
    huid: 'HUID3311',
    purityKarat: '22K916',
    grossWeight: 24.5,
    netWeight: 23.8,
    lessWeight: 0.7,
    makingCharge: 450,
    totalPrice: 175400
  });

  assert.ok(zpl.includes('^PW480'), 'Butterfly tag width must be 480 dots (60mm)');
  assert.ok(zpl.includes('^LL224'), 'Butterfly tag length must be 224 dots (28mm)');
  assert.ok(zpl.includes('^FO20,112^GB440,1,1^FS'), 'ZPL must contain the central fold line indicator');
  assert.ok(zpl.includes('BNGL88 (Bangles)'), 'ZPL must encode item and category');
  assert.ok(zpl.includes('GW: 24.500g  NW: 23.800g'), 'ZPL must encode weights with 3 decimal precision');
});

// -------------------------------------------------------------------------
// 3. Dynamic NPCI UPI QR Code Engine Tests
// -------------------------------------------------------------------------
console.log('\n--- 3. Testing Dynamic NPCI UPI Payment QR Code Generator ---');

test('[UPI-01] NPCI UPI payment URL construction with mandatory fields', () => {
  const upiUrl = buildUpiPaymentUrl({
    upiId: 'krishnajewellers@icici',
    payeeName: 'Krishna Jewellers',
    amount: 57872.50,
    transactionRef: 'KJ/26-27/INV-0082',
    transactionNote: 'Gold Ring Purchase'
  });

  assert.ok(upiUrl.startsWith('upi://pay?'), 'Must start with official upi://pay? scheme');
  assert.ok(upiUrl.includes('pa=krishnajewellers@icici'), 'Must include payee VPA address');
  assert.ok(upiUrl.includes('pn=Krishna%20Jewellers'), 'Must include URL-encoded payee name');
  assert.ok(upiUrl.includes('am=57872.50'), 'Must format amount with 2 decimal digits');
  assert.ok(upiUrl.includes('tr=KJ%2F26-27%2FINV-0082'), 'Must include transaction reference invoice number');
  assert.ok(upiUrl.includes('cu=INR'), 'Must specify currency INR');
});

test('[UPI-02] 2D QR Matrix generation and finder pattern verification', () => {
  const testText = 'upi://pay?pa=test@upi&pn=Test&am=100.00&cu=INR';
  const matrix = generateQrMatrix(testText);

  assert.ok(Array.isArray(matrix), 'Matrix should be a 2D array');
  assert.ok(matrix.length >= 21, 'QR matrix size should be at least 21x21 modules');
  assert.strictEqual(matrix.length, matrix[0].length, 'QR matrix must be square');

  // Verify top-left finder pattern center (row 3, col 3 is solid dark = 1)
  assert.strictEqual(matrix[3][3], 1, 'Finder pattern center module must be 1');
  // Verify top-left separator (row 0, col 7 is white = 0)
  assert.strictEqual(matrix[0][7], 0, 'Finder separator module must be 0');
});

test('[UPI-03] Standalone SVG serialization from QR matrix', () => {
  const matrix = generateQrMatrix('BARCODE1201');
  const svg = qrMatrixToSvg(matrix, 120, 2);

  assert.ok(svg.includes('<svg'), 'Output must contain svg opening tag');
  assert.ok(svg.includes('viewBox="0 0'), 'SVG must include scalable viewBox');
  assert.ok(svg.includes('width="120"'), 'SVG must respect requested width');
  assert.ok(svg.includes('fill="#0f172a"'), 'SVG must contain dark module rectangles');
});

console.log('\n----------------------------------------------------------------------');
console.log(`TOTAL HARDWARE & INTEGRATION TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('----------------------------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL HARDWARE AND INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
}
