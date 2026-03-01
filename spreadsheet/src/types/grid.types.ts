export type RowType = 'data' | 'subtotal' | 'total' | 'sectionHeader' | 'spacer';

export type PeriodType = 'D' | 'M' | 'Q' | 'Y';

export type NegativeDisplayFormat = 'parentheses' | 'minus';

export type DisplayScale = 'decimal' | 'units' | 'thousands' | 'millions';

export type DateDisplayFormat = 'MM/DD/YYYY' | 'MM/DD/YY' | 'MM/YY';

export type FontHighlight = 'red' | 'green' | 'blue' | null;
export type BackgroundHighlight = 'orange' | 'yellow' | 'pink' | null;

export interface CellHighlight {
  fontHighlight: FontHighlight;
  backgroundHighlight: BackgroundHighlight;
  boldBorder: boolean;
}

export interface RowDefinition {
  lineItemCode: string;
  label: string;
  rowType: RowType;
  indentLevel: number;
  isEditable: boolean;
}

export interface PeriodDefinition {
  periodId: string;
  periodEnd: string;
  periodType: PeriodType;
  variant?: string;
  isActive: boolean;
  isIncluded: boolean;
}

export interface CellChange {
  lineItemCode: string;
  periodId: string;
  oldValue: number | null;
  newValue: number | null;
}

export interface GridProps {
    rows: RowDefinition[];
    periods: PeriodDefinition[];
    values: Map<string, number>;
    highlights: Map<string, CellHighlight>;
    companyName?: string;
    onChange: (changes: CellChange[]) => void;
    onHighlightChange?: (key: string, highlight: CellHighlight | null) => void;
    comments: Map<string, string>;
    onCommentChange?: (key: string, comment: string | null) => void;
    onDeletePeriod?: (periodId: string) => void;
    onClearPeriod?: (periodId: string) => void;
    onInsertColumn?: (atColIndex: number, position: 'left' | 'right', mode: 'clone' | 'blank') => void;
    onToggleActive?: (periodId: string) => void;
    onInsertRow?: (atIndex: number, position: 'above' | 'below') => void;
    onDeleteRow?: (atIndex: number) => void;
    onMoveRow?: (fromIndex: number, direction: 'up' | 'down') => void;
    negativeFormat?: NegativeDisplayFormat;
    displayScale?: DisplayScale;
    dateFormat?: DateDisplayFormat;
    decimalPlaces?: number;
  }

export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}

export interface GridState {
  focusedCell: CellPosition | null;
  editingCell: CellPosition | null;
  editValue: string;
}

export function makeValueKey(lineItemCode: string, periodId: string): string {
  return `${lineItemCode}|${periodId}`;
}

export function formatPeriodDate(periodEnd: string, format: DateDisplayFormat): string {
  const parts = periodEnd.split('-');
  if (parts.length !== 3) return periodEnd;
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const shortYear = year.slice(2);

  switch (format) {
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'MM/DD/YY':   return `${month}/${day}/${shortYear}`;
    case 'MM/YY':       return `${month}/${shortYear}`;
    default:            return periodEnd;
  }
}

export function getPeriodsWithNoActiveVariant(periods: PeriodDefinition[]): string[] {
  const dateGroups = new Map<string, PeriodDefinition[]>();
  periods.forEach(p => {
    const group = dateGroups.get(p.periodEnd) || [];
    group.push(p);
    dateGroups.set(p.periodEnd, group);
  });

  const orphanedDates: string[] = [];
  dateGroups.forEach((group, date) => {
    const hasActive = group.some(p => p.isActive);
    if (!hasActive) {
      orphanedDates.push(date);
    }
  });

  return orphanedDates;
}