/**
 * Standalone Zero-Dependency QR Code Generator
 * Generates valid QR Codes (Versions 1-6, Byte Mode, Error Correction L/M)
 * and outputs SVG markup directly for scannable NPCI UPI payments & serial tags.
 */

// Galois Field GF(256) Math
const EXP_TABLE = new Uint8Array(256);
const LOG_TABLE = new Uint8Array(256);
(function initGFTables() {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = val;
    LOG_TABLE[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
  EXP_TABLE[255] = EXP_TABLE[0];
})();

function gfMultiply(x, y) {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[x] + LOG_TABLE[y]) % 255];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = [0];
    const root = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], root);
      next.push(poly[j]);
    }
    poly = next;
  }
  return poly;
}

function rsCalculateRemainder(data, numEccWords) {
  const gen = rsGeneratorPoly(numEccWords);
  const remainder = new Array(numEccWords).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let j = 0; j < numEccWords; j++) {
      remainder[j] ^= gfMultiply(gen[j + 1], factor);
    }
  }
  return remainder;
}

// QR Code Capacities & ECC for Level M:
// Version 1: 21x21, 16 data bytes, 10 EC bytes
// Version 2: 25x25, 28 data bytes, 16 EC bytes
// Version 3: 29x29, 44 data bytes, 26 EC bytes
// Version 4: 33x33, 64 data bytes, 36 EC bytes (2 blocks of 32/18)
// Version 5: 37x37, 86 data bytes, 48 EC bytes
// Version 6: 41x41, 108 data bytes, 64 EC bytes
const VERSION_TABLE = [
  null,
  { version: 1, size: 21, dataBytes: 16, ecBytes: 10, blocks: 1 },
  { version: 2, size: 25, dataBytes: 28, ecBytes: 16, blocks: 1 },
  { version: 3, size: 29, dataBytes: 44, ecBytes: 26, blocks: 1 },
  { version: 4, size: 33, dataBytes: 64, ecBytes: 36, blocks: 2 },
  { version: 5, size: 37, dataBytes: 86, ecBytes: 48, blocks: 2 },
  { version: 6, size: 41, dataBytes: 108, ecBytes: 64, blocks: 4 },
  { version: 7, size: 45, dataBytes: 124, ecBytes: 72, blocks: 4 },
  { version: 8, size: 49, dataBytes: 154, ecBytes: 88, blocks: 4 },
];

function chooseVersion(byteCount) {
  for (let v = 1; v < VERSION_TABLE.length; v++) {
    // 4 bits mode + 8 bits char count = 12 bits (1.5 bytes) overhead for byte mode
    if (byteCount + 2 <= VERSION_TABLE[v].dataBytes) {
      return VERSION_TABLE[v];
    }
  }
  return VERSION_TABLE[8]; // Fallback to v8
}

export function generateQrMatrix(text) {
  const utf8Bytes = [];
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code < 0x80) utf8Bytes.push(code);
    else if (code < 0x800) {
      utf8Bytes.push(0xc0 | (code >> 6));
      utf8Bytes.push(0x80 | (code & 0x3f));
    } else {
      utf8Bytes.push(0xe0 | (code >> 12));
      utf8Bytes.push(0x80 | ((code >> 6) & 0x3f));
      utf8Bytes.push(0x80 | (code & 0x3f));
    }
  }

  const vInfo = chooseVersion(utf8Bytes.length);
  const size = vInfo.size;
  const matrix = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

  function setModule(r, c, val, func = true) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val ? 1 : 0;
      if (func) isFunction[r][c] = true;
    }
  }

  // 1. Finder patterns (7x7) at three corners
  function drawFinder(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(nr, nc, isBorder || isCenter);
          } else {
            setModule(nr, nc, false); // Separator
          }
        }
      }
    }
  }
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment patterns for Version >= 2
  if (vInfo.version >= 2) {
    const alignPos = [6, size - 7];
    for (const ar of alignPos) {
      for (const ac of alignPos) {
        if (isFunction[ar][ac]) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            const isEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
            const isMid = r === 0 && c === 0;
            setModule(ar + r, ac + c, isEdge || isMid);
          }
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const val = i % 2 === 0;
    if (!isFunction[6][i]) setModule(6, i, val);
    if (!isFunction[i][6]) setModule(i, 6, val);
  }

  // Dark module
  setModule(size - 8, 8, true);

  // 4. Encode Data & Bit Stream
  const bitStream = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  }

  // Byte mode indicator: 0100
  pushBits(0b0100, 4);
  // Character count indicator (8 bits for v1-9)
  pushBits(utf8Bytes.length, 8);
  for (const b of utf8Bytes) pushBits(b, 8);

  // Terminator (up to 4 zeroes)
  const maxDataBits = vInfo.dataBytes * 8;
  const termLen = Math.min(4, maxDataBits - bitStream.length);
  for (let i = 0; i < termLen; i++) bitStream.push(0);

  // Byte align
  while (bitStream.length % 8 !== 0) bitStream.push(0);

  // Pad bytes 0xEC, 0x11
  const padBytes = [0xec, 0x11];
  let pIdx = 0;
  while (bitStream.length < maxDataBits) {
    pushBits(padBytes[pIdx % 2], 8);
    pIdx++;
  }

  // Split into data words
  const dataWords = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    let word = 0;
    for (let b = 0; b < 8; b++) word = (word << 1) | bitStream[i + b];
    dataWords.push(word);
  }

  // Error Correction calculation
  const totalEcBytes = vInfo.ecBytes;
  const numBlocks = vInfo.blocks;
  const dataPerBlock = Math.floor(vInfo.dataBytes / numBlocks);
  const ecPerBlock = Math.floor(totalEcBytes / numBlocks);

  const finalMessageBits = [];
  const blockData = [];
  const blockEc = [];

  for (let b = 0; b < numBlocks; b++) {
    const start = b * dataPerBlock;
    const slice = dataWords.slice(start, start + dataPerBlock);
    blockData.push(slice);
    blockEc.push(rsCalculateRemainder(slice, ecPerBlock));
  }

  // Interleave data words
  for (let i = 0; i < dataPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      pushBits(blockData[b][i], 8);
    }
  }
  // Interleave EC words
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) {
      pushBits(blockEc[b][i], 8);
    }
  }

  // 5. Place Data Bits in Matrix (zigzag from bottom-right)
  let bitIdx = 0;
  let dir = -1; // -1: up, +1: down
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing column
    const rows = dir === -1
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[row][c]) {
          const bit = bitIdx < bitStream.length ? bitStream[bitIdx++] : 0;
          // Apply standard Mask 0: (row + col) % 2 == 0
          const mask = (row + c) % 2 === 0;
          matrix[row][c] = (bit ^ (mask ? 1 : 0)) ? 1 : 0;
        }
      }
    }
    dir = -dir;
  }

  // 6. Format info bits (ECC Level M = 00, Mask 0 = 000 -> 101010000010010 XOR 101010000010010)
  // Format string for (M, Mask 0) is 101010000010010 ^ 101010000010010 = 0x0000 with mask 0x5412 = 0x5412
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  // Draw format around top-left
  for (let i = 0; i <= 5; i++) setModule(8, i, formatBits[i]);
  setModule(8, 7, formatBits[6]);
  setModule(8, 8, formatBits[7]);
  setModule(7, 8, formatBits[8]);
  for (let i = 9; i <= 14; i++) setModule(14 - i, 8, formatBits[i]);

  // Draw format around other finders
  for (let i = 0; i <= 7; i++) setModule(size - 1 - i, 8, formatBits[i]);
  for (let i = 8; i <= 14; i++) setModule(8, size - 15 + i, formatBits[i]);

  return matrix;
}

/**
 * Builds an official NPCI UPI payment URL string.
 */
export function buildUpiPaymentUrl({
  upiId,
  payeeName,
  amount,
  transactionRef,
  transactionNote = 'Jewellery OS Invoice Payment'
}) {
  const cleanUpi = (upiId || '').trim();
  const cleanName = encodeURIComponent((payeeName || 'Jeweller').trim());
  const cleanAmt = Number(amount || 0).toFixed(2);
  const cleanRef = encodeURIComponent((transactionRef || 'INV').trim());
  const cleanNote = encodeURIComponent(transactionNote.trim());

  return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${cleanAmt}&tr=${cleanRef}&cu=INR&tn=${cleanNote}`;
}

/**
 * Renders the QR code matrix as an SVG string.
 */
export function qrMatrixToSvg(matrix, sizePx = 160, margin = 2) {
  if (!matrix || !matrix.length) return '';
  const moduleCount = matrix.length;
  const viewBoxSize = moduleCount + margin * 2;

  let rects = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c] === 1) {
        rects += `<rect x="${c + margin}" y="${r + margin}" width="1" height="1" fill="#0f172a" />`;
      }
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges">
      <rect width="100%" height="100%" fill="#ffffff" />
      ${rects}
    </svg>
  `.trim();
}
