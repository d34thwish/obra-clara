export function parseMoneyMinor(value: unknown, currency = 'PEN'): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  let s = String(value).trim().replace(/\s/g, '').replace(/[S$€]/g, '');
  const comma = s.lastIndexOf(','),
    dot = s.lastIndexOf('.');
  if (comma >= 0 && dot >= 0)
    s = comma > dot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (comma >= 0) s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
  if (!/^-?\d+(\.\d+)?$/.test(s)) throw new Error(`Invalid amount: ${value}`);
  const decimals = currency === 'JPY' ? 0 : 2;
  const [whole, fraction = ''] = s.split('.');
  const sign = whole.startsWith('-') ? -1 : 1;
  const abs = whole.replace('-', '');
  const minor =
    BigInt(abs) * BigInt(10 ** decimals) +
    BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals));
  const n = Number(minor) * sign;
  if (!Number.isSafeInteger(n)) throw new Error('Amount exceeds safe integer range');
  return n;
}
export function normalizeCurrency(v: unknown) {
  const s = String(v ?? '')
    .trim()
    .toUpperCase();
  if (!s) return null;
  const map: Record<string, string> = {
    'S/': 'PEN',
    SOLES: 'PEN',
    SOL: 'PEN',
    US$: 'USD',
    DÓLARES: 'USD',
    DOLARES: 'USD',
  };
  return map[s] || (/^[A-Z]{3}$/.test(s) ? s : null);
}
export function normalizeDate(v: unknown) {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const s = String(v).trim();
  const m = s.match(new RegExp('^(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})$'));
  const iso = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : s.slice(0, 10);
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.valueOf()) || d.toISOString().slice(0, 10) !== iso)
    throw new Error(`Invalid date: ${v}`);
  return iso;
}
export const stableId = (prefix: string, value: string) =>
  `${prefix}:${value
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9:_-]/g, '')
    .slice(0, 120)}`;
