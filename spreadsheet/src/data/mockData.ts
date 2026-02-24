import { RowDefinition, PeriodDefinition, makeValueKey } from '../types/grid.types';

export const mockRows: RowDefinition[] = [
  { lineItemCode: 'HEADER_ASSETS', label: 'ASSETS', rowType: 'sectionHeader', indentLevel: 0, isEditable: false },
  { lineItemCode: 'Asset.Current.Cash', label: 'Cash', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'Asset.Current.AR', label: 'Accounts Receivable', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'Asset.Current.Inventory', label: 'Inventory', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'SUBTOTAL_CurrentAssets', label: 'Total Current Assets', rowType: 'subtotal', indentLevel: 0, isEditable: false },
  { lineItemCode: 'SPACER_1', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
  { lineItemCode: 'Asset.Fixed.PPE', label: 'Property, Plant & Equipment', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'Asset.Fixed.AccumDepr', label: 'Accumulated Depreciation', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'SUBTOTAL_FixedAssets', label: 'Total Fixed Assets', rowType: 'subtotal', indentLevel: 0, isEditable: false },
  { lineItemCode: 'TOTAL_Assets', label: 'TOTAL ASSETS', rowType: 'total', indentLevel: 0, isEditable: false },
  { lineItemCode: 'SPACER_2', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
  { lineItemCode: 'HEADER_LIABILITIES', label: 'LIABILITIES', rowType: 'sectionHeader', indentLevel: 0, isEditable: false },
  { lineItemCode: 'Liability.Current.AP', label: 'Accounts Payable', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'Liability.Current.AccruedExp', label: 'Accrued Expenses', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'SUBTOTAL_CurrentLiab', label: 'Total Current Liabilities', rowType: 'subtotal', indentLevel: 0, isEditable: false },
  { lineItemCode: 'TOTAL_Liabilities', label: 'TOTAL LIABILITIES', rowType: 'total', indentLevel: 0, isEditable: false },
];

export const allPeriods: PeriodDefinition[] = [
  { periodEnd: '2022-12-31', periodType: 'Y', label: 'FY 2022' },
  { periodEnd: '2023-12-31', periodType: 'Y', label: 'FY 2023' },
  { periodEnd: '2024-12-31', periodType: 'Y', label: 'FY 2024' },
];

export function createMockValues(): Map<string, number> {
  const values = new Map<string, number>();
  
  // FY 2022
  values.set(makeValueKey('Asset.Current.Cash', '2022-12-31'), 618000);
  values.set(makeValueKey('Asset.Current.AR', '2022-12-31'), 2332000);
  values.set(makeValueKey('Asset.Current.Inventory', '2022-12-31'), 980000);
  values.set(makeValueKey('SUBTOTAL_CurrentAssets', '2022-12-31'), 3930000);
  values.set(makeValueKey('Asset.Fixed.PPE', '2022-12-31'), 5800000);
  values.set(makeValueKey('Asset.Fixed.AccumDepr', '2022-12-31'), -1450000);
  values.set(makeValueKey('SUBTOTAL_FixedAssets', '2022-12-31'), 4350000);
  values.set(makeValueKey('TOTAL_Assets', '2022-12-31'), 8280000);
  values.set(makeValueKey('Liability.Current.AP', '2022-12-31'), 1150000);
  values.set(makeValueKey('Liability.Current.AccruedExp', '2022-12-31'), 298000);
  values.set(makeValueKey('SUBTOTAL_CurrentLiab', '2022-12-31'), 1448000);
  values.set(makeValueKey('TOTAL_Liabilities', '2022-12-31'), 1448000);

  // FY 2023
  values.set(makeValueKey('Asset.Current.Cash', '2023-12-31'), 725000);
  values.set(makeValueKey('Asset.Current.AR', '2023-12-31'), 2580000);
  values.set(makeValueKey('Asset.Current.Inventory', '2023-12-31'), 1100000);
  values.set(makeValueKey('SUBTOTAL_CurrentAssets', '2023-12-31'), 4405000);
  values.set(makeValueKey('Asset.Fixed.PPE', '2023-12-31'), 6400000);
  values.set(makeValueKey('Asset.Fixed.AccumDepr', '2023-12-31'), -1750000);
  values.set(makeValueKey('SUBTOTAL_FixedAssets', '2023-12-31'), 4650000);
  values.set(makeValueKey('TOTAL_Assets', '2023-12-31'), 9055000);
  values.set(makeValueKey('Liability.Current.AP', '2023-12-31'), 1320000);
  values.set(makeValueKey('Liability.Current.AccruedExp', '2023-12-31'), 345000);
  values.set(makeValueKey('SUBTOTAL_CurrentLiab', '2023-12-31'), 1665000);
  values.set(makeValueKey('TOTAL_Liabilities', '2023-12-31'), 1665000);

  // FY 2024
  values.set(makeValueKey('Asset.Current.Cash', '2024-12-31'), 890000);
  values.set(makeValueKey('Asset.Current.AR', '2024-12-31'), 2850000);
  values.set(makeValueKey('Asset.Current.Inventory', '2024-12-31'), 1250000);
  values.set(makeValueKey('SUBTOTAL_CurrentAssets', '2024-12-31'), 4990000);
  values.set(makeValueKey('Asset.Fixed.PPE', '2024-12-31'), 7100000);
  values.set(makeValueKey('Asset.Fixed.AccumDepr', '2024-12-31'), -2100000);
  values.set(makeValueKey('SUBTOTAL_FixedAssets', '2024-12-31'), 5000000);
  values.set(makeValueKey('TOTAL_Assets', '2024-12-31'), 9990000);
  values.set(makeValueKey('Liability.Current.AP', '2024-12-31'), 1480000);
  values.set(makeValueKey('Liability.Current.AccruedExp', '2024-12-31'), 392000);
  values.set(makeValueKey('SUBTOTAL_CurrentLiab', '2024-12-31'), 1872000);
  values.set(makeValueKey('TOTAL_Liabilities', '2024-12-31'), 1872000);

  return values;
}