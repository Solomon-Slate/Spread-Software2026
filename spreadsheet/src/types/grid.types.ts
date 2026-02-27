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
  periodId: string;        // Unique ID (e.g., "2023-12-31_v1", "2023-12-31_cpa")
  periodEnd: string;       // The actual date "2023-12-31" (can be duplicated for variants)
  periodType: PeriodType;
  variant?: string;        // Optional label: "Company Prepared", "CPA Reviewed", "Pro Forma"

  /**
   * isActive: Marks this variant as the "official" version for its periodEnd date.
   * 
   * Among all periods sharing the same periodEnd, exactly one should be isActive: true.
   * This is the version that the database treats as the real/official data.
   * Inactive variants exist only for comparison, what-if scenarios, or draft purposes.
   * 
   * Rules:
   * - Single-variant periods: automatically active (enforced by UI)
   * - Multi-variant periods: exactly one must be active
   * - C# backend uses isActive to determine which data feeds into:
   *     calculations, equity reconciliation, ratio analysis, graphs, reports, 
   *     portfolio-level aggregations, and any database queries
   * - Inactive data is effectively invisible to the analytical engine
   * 
   * AUDIT: If any periodEnd date has zero active variants, an audit warning must be raised.
   * This validation is performed by getPeriodsWithNoActiveVariant() in this file.
   */
  isActive: boolean;

  /**
   * isIncluded: Controls whether this period is selected for the current analytical run.
   * 
   * A period must be BOTH isActive AND isIncluded to appear in:
   *   - Cash flow analysis (with custom anchor period support)
   *   - Equity reconciliation
   *   - Ratio analysis and trend reports
   *   - Printed output / report generation
   *   - Graphs and charts
   * 
   * This is separate from isActive because:
   *   - isActive = "this is the official data" (database-level truth)
   *   - isIncluded = "include this in the current analysis" (user's analytical selection)
   * 
   * Example: User has periods 12/31/2020 through 12/31/2024, all active.
   *   - For a 2-year analysis: include only 12/31/2023 and 12/31/2024
   *   - For quarterly detail: include 12/31/2022, 3/31/2023, 6/30/2023, 9/30/2023
   *   - For custom cash flow: include 3/31/2023 through 9/30/2024 with 3/31/2023 as anchor
   * 
   * UI: This will be controlled via a "Run Analysis" / "Print Analysis" dialog
   *   in the menu bar (not a grid toggle). The dialog will show a checklist of
   *   active periods and let the user select which to include, plus set an anchor.
   * 
   * Default: true (all active periods included unless user narrows the selection)
   */
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
    companyName?: string;
    onChange: (changes: CellChange[]) => void;
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

/**
 * AUDIT VALIDATION: Detect periodEnd dates that have NO active variant.
 * 
 * Returns an array of periodEnd date strings where no variant is marked isActive.
 * This is a data integrity issue — every date should have exactly one active variant.
 * 
 * Usage (future): 
 *   - Call on spread load, on period insert/delete, on active toggle
 *   - Display warnings in a status bar, audit panel, or alert dialog
 *   - C# backend should also run this check independently on save
 * 
 * Example return: ['2023-12-31'] means that date has variants but none are active.
 */
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