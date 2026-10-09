const FORMULA_PREFIX = /^[\s\u0000-\u001f]*[=+\-@]/;

export function csvCell(value) {
  if (value === null || value === undefined) return '""';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);

  let text = String(value);
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeCsv(rows) {
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
