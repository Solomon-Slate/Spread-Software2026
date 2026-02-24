export type RowType = 'data' | 'subtotal' | 'total' | 'sectionHeader' | 'spacer';

export type PeriodType = 'D' | 'M' | 'Q' | 'Y';

export type NegativeDisplayFormat = 'parentheses' | 'minus';

export type DisplayScale = 'units' | 'thousands' | 'millions';

export interface RowDefinition {
  lineItemCode: string;
  label: string;
  rowType: RowType;
  indentLevel: number;
  isEditable: boolean;
}

export interface PeriodDefinition {
  periodEnd: string;
  periodType: PeriodType;
  label: string;
}

export interface CellChange {
  lineItemCode: string;
  periodEnd: string;
  oldValue: number | null;
  newValue: number | null;
}

export interface GridProps {
    rows: RowDefinition[];
    periods: PeriodDefinition[];
    values: Map<string, number>;
    onChange: (changes: CellChange[]) => void;
    onDeletePeriod?: (periodEnd: string) => void;
    onClearPeriod?: (periodEnd: string) => void;
    negativeFormat?: NegativeDisplayFormat;
    displayScale?: DisplayScale;
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

export function makeValueKey(lineItemCode: string, periodEnd: string): string {
  return `${lineItemCode}|${periodEnd}`;
}