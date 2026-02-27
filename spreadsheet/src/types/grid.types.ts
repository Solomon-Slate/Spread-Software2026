export type RowType = 'data' | 'subtotal' | 'total' | 'sectionHeader' | 'spacer';

export type PeriodType = 'D' | 'M' | 'Q' | 'Y';

export type NegativeDisplayFormat = 'parentheses' | 'minus';

export type DisplayScale = 'units' | 'thousands' | 'millions';

export type DateDisplayFormat = 'MM/DD/YYYY' | 'MM/DD/YY' | 'MM/YY';

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
    companyName?: string;
    onChange: (changes: CellChange[]) => void;
    onDeletePeriod?: (periodId: string) => void;
    onClearPeriod?: (periodId: string) => void;
    onInsertColumn?: (atColIndex: number, position: 'left' | 'right', mode: 'clone' | 'blank') => void;
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