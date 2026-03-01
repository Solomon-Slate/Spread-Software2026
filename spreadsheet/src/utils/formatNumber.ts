import { NegativeDisplayFormat, DisplayScale } from '../types/grid.types';

export interface FormatOptions {
  negativeFormat: NegativeDisplayFormat;
  displayScale: DisplayScale;
  decimalPlaces: number;
}

const DEFAULT_OPTIONS: FormatOptions = {
  negativeFormat: 'parentheses',
  displayScale: 'units',
  decimalPlaces: 0,
};

function getScaleDivisor(scale: DisplayScale): number {
  switch (scale) {
    case 'thousands': return 1000;
    case 'millions': return 1000000;
    default: return 1; // 'units' and 'decimal' both show full magnitude
  }
}

export function formatNumber(
  value: number | null | undefined,
  options: Partial<FormatOptions> = {}
): string {
  if (value === null || value === undefined) return '';

  const opts: FormatOptions = { ...DEFAULT_OPTIONS, ...options };
  const scaledValue = value / getScaleDivisor(opts.displayScale);
  const isNegative = scaledValue < 0;
  const absoluteValue = Math.abs(scaledValue);
  
  const rounded = absoluteValue.toFixed(opts.decimalPlaces);
  const parts = rounded.split('.');
  const withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = parts[1] ? `${withCommas}.${parts[1]}` : withCommas;
  
  if (isNegative) {
    return opts.negativeFormat === 'parentheses' ? `(${formatted})` : `-${formatted}`;
  }
  return formatted;
}

export function parseNumber(input: string): number | null {
  if (!input || input.trim() === '') return null;
  
  let cleaned = input.trim();
  let isNegative = false;
  
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    isNegative = true;
    cleaned = cleaned.slice(1, -1);
  } else if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.slice(1);
  }
  
  cleaned = cleaned.replace(/,/g, '').trim();
  
  if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '' || cleaned === '.') {
    return null;
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : (isNegative ? -parsed : parsed);
}

export function formatForEditing(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value.toString();
}

/**
 * Round a value to 2 decimal places (cents).
 * Applied at commit time to prevent hidden precision beyond cents.
 * Uses arithmetic rounding: Math.round(value * 100) / 100
 */
export function roundToCents(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value * 100) / 100;
}