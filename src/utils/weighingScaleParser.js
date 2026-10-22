/**
 * Pure parsing logic for Electronic Digital Weighing Scales
 * Compatible with Node.js and Browser environments.
 */

export function parseScaleWeightString(rawChunk) {
  if (!rawChunk || typeof rawChunk !== 'string') {
    return { weight: 0, isStable: false, raw: '', unit: 'g' };
  }

  const clean = rawChunk.trim();

  // Stability detection
  // 'ST' = Stable (Essae, CAS), 'US' = Unstable, 'S' = Stable (Mettler)
  const isUnstable = /US|\?/i.test(clean);
  const isExplicitStable = /ST|^S\b/i.test(clean);
  const isStable = isExplicitStable || (!isUnstable && clean.length > 0);

  // Extract numeric weight
  const match = clean.match(/[-+]?\s*([0-9]+\.?[0-9]*)/);
  if (!match) {
    return { weight: 0, isStable: false, raw: clean, unit: 'g' };
  }

  let num = parseFloat(match[1]);
  if (isNaN(num)) num = 0;

  // Handle negative sign
  if (clean.includes('-') && !clean.includes('+')) {
    num = -num;
  }

  // Detect KG vs Grams
  const isKg = /kg/i.test(clean);
  const weightInGrams = isKg ? num * 1000 : num;

  return {
    weight: Number(weightInGrams.toFixed(3)),
    isStable,
    raw: clean,
    unit: 'g'
  };
}
