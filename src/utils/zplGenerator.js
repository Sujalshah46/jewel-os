/**
 * Zebra Programming Language (ZPL-II) Tag Generator
 * Generates ready-to-print ZPL code for Indian jewellery dumbbell and butterfly labels.
 * Compatible with Zebra (ZD220, ZD420, GX420), TSC (TE244, TTP-244), Citizen (CL-S621), TVS, and Godex.
 */

/**
 * Generates ZPL for 86mm x 14mm Dumbbell (Rat-tail) Jewellery Tag
 * Resolution: 203 DPI (8 dots/mm) -> Width: ~688 dots, Length: ~112 dots
 */
export function generateDumbbellZpl({
  firmCode = 'KJJ',
  itemCode = 'NK-204',
  barcode = '1201',
  huid = 'HUID9921',
  purityKarat = '22K916',
  grossWeight = 0,
  netWeight = 0,
  makingCharge = 0,
  totalPrice = 0
}) {
  const gwStr = Number(grossWeight).toFixed(3);
  const nwStr = Number(netWeight).toFixed(3);
  const priceRound = Math.round(Number(totalPrice) || 0);

  return [
    '^XA',
    '^PW688',              // Print width in dots (~86mm @ 203 DPI)
    '^LL112',              // Label length in dots (~14mm @ 203 DPI)
    '^LH0,0',              // Label home position
    // --- Left Head (Front Face) ---
    `^FO30,12^A0N,24,22^FD${firmCode}^FS`,
    `^FO130,14^A0N,20,18^FD${purityKarat}^FS`,
    `^FO30,40^A0N,20,18^FD${itemCode}^FS`,
    `^FO30,64^A0N,18,16^FDBAR: ${barcode}^FS`,
    `^FO30,86^A0N,18,16^FDHUID: ${huid || 'NA'}^FS`,
    // --- Right Head (Back Face with Weights & QR Code) ---
    `^FO430,14^A0N,18,16^FDGW: ${gwStr}g^FS`,
    `^FO430,36^A0N,18,16^FDNW: ${nwStr}g^FS`,
    `^FO430,58^A0N,18,16^FDMKG: INR ${makingCharge}/g^FS`,
    `^FO430,80^A0N,24,22^FDINR ${priceRound}^FS`,
    // QR Code on right head: Model 2, Magnification 3
    `^FO580,12^BQN,2,3^FDQA,${barcode}^FS`,
    '^XZ'
  ].join('\n');
}

/**
 * Generates ZPL for 60mm x 28mm Butterfly (Foldover Dual Wing) Jewellery Tag
 * Resolution: 203 DPI (8 dots/mm) -> Width: ~480 dots, Length: ~224 dots
 */
export function generateButterflyZpl({
  firmName = 'Krishna Jewellers',
  itemCode = 'NK-204',
  category = 'Necklace',
  barcode = '1201',
  huid = 'HUID9921',
  purityKarat = '22K916',
  grossWeight = 0,
  netWeight = 0,
  lessWeight = 0,
  makingCharge = 0,
  totalPrice = 0
}) {
  const gwStr = Number(grossWeight).toFixed(3);
  const nwStr = Number(netWeight).toFixed(3);
  const lwStr = Number(lessWeight || 0).toFixed(3);
  const priceRound = Math.round(Number(totalPrice) || 0);

  return [
    '^XA',
    '^PW480',              // Print width in dots (~60mm @ 203 DPI)
    '^LL224',              // Label length in dots (~28mm @ 203 DPI)
    '^LH0,0',
    // --- Upper Wing ---
    `^FO25,12^A0N,24,22^FD${firmName.slice(0, 22)}^FS`,
    `^FO360,12^A0N,22,20^FD${purityKarat}^FS`,
    `^FO25,40^A0N,20,18^FD${itemCode} (${category})^FS`,
    `^FO25,64^A0N,18,16^FDBARCODE: ${barcode}  HUID: ${huid || 'NA'}^FS`,
    `^FO25,88^A0N,24,22^FDINR ${priceRound}^FS`,
    // --- Center Fold Dotted Line Indicator ---
    '^FO20,112^GB440,1,1^FS',
    // --- Lower Wing (Weights + QR Code) ---
    `^FO25,122^A0N,18,16^FDGW: ${gwStr}g  NW: ${nwStr}g^FS`,
    `^FO25,144^A0N,18,16^FDLW: ${lwStr}g  MKG: INR ${makingCharge}/g^FS`,
    `^FO25,168^A0N,20,18^FDPURITY: BIS ${purityKarat}^FS`,
    `^FO25,190^A0N,18,16^FDVERIFY: HUID CERTIFIED^FS`,
    // Lower Right QR Code: Model 2, Magnification 3
    `^FO360,122^BQN,2,3^FDQA,${barcode}^FS`,
    '^XZ'
  ].join('\n');
}

/**
 * Downloads a generated ZPL string as a raw `.zpl` text file.
 */
export function downloadZplFile(zplContent, filename = 'jewellery-tag.zpl') {
  const blob = new Blob([zplContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
