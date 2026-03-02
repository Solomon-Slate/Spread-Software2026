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
  { periodId: '2022-12-31_v1', periodEnd: '2022-12-31', periodType: 'Y', isActive: true, isIncluded: true },
  { periodId: '2023-12-31_v1', periodEnd: '2023-12-31', periodType: 'Y', isActive: true, isIncluded: true },
  { periodId: '2024-12-31_v1', periodEnd: '2024-12-31', periodType: 'Y', isActive: true, isIncluded: true },
];

export function createMockValues(): Map<string, number> {
  const values = new Map<string, number>();
  
  values.set(makeValueKey('Asset.Current.Cash', '2022-12-31_v1'), 618000);
  values.set(makeValueKey('Asset.Current.AR', '2022-12-31_v1'), 2332000);
  values.set(makeValueKey('Asset.Current.Inventory', '2022-12-31_v1'), 980000);
  values.set(makeValueKey('SUBTOTAL_CurrentAssets', '2022-12-31_v1'), 3930000);
  values.set(makeValueKey('Asset.Fixed.PPE', '2022-12-31_v1'), 5800000);
  values.set(makeValueKey('Asset.Fixed.AccumDepr', '2022-12-31_v1'), -1450000);
  values.set(makeValueKey('SUBTOTAL_FixedAssets', '2022-12-31_v1'), 4350000);
  values.set(makeValueKey('TOTAL_Assets', '2022-12-31_v1'), 8280000);
  values.set(makeValueKey('Liability.Current.AP', '2022-12-31_v1'), 1150000);
  values.set(makeValueKey('Liability.Current.AccruedExp', '2022-12-31_v1'), 298000);
  values.set(makeValueKey('SUBTOTAL_CurrentLiab', '2022-12-31_v1'), 1448000);
  values.set(makeValueKey('TOTAL_Liabilities', '2022-12-31_v1'), 1448000);

  values.set(makeValueKey('Asset.Current.Cash', '2023-12-31_v1'), 725000);
  values.set(makeValueKey('Asset.Current.AR', '2023-12-31_v1'), 2580000);
  values.set(makeValueKey('Asset.Current.Inventory', '2023-12-31_v1'), 1100000);
  values.set(makeValueKey('SUBTOTAL_CurrentAssets', '2023-12-31_v1'), 4405000);
  values.set(makeValueKey('Asset.Fixed.PPE', '2023-12-31_v1'), 6400000);
  values.set(makeValueKey('Asset.Fixed.AccumDepr', '2023-12-31_v1'), -1750000);
  values.set(makeValueKey('SUBTOTAL_FixedAssets', '2023-12-31_v1'), 4650000);
  values.set(makeValueKey('TOTAL_Assets', '2023-12-31_v1'), 9055000);
  values.set(makeValueKey('Liability.Current.AP', '2023-12-31_v1'), 1320000);
  values.set(makeValueKey('Liability.Current.AccruedExp', '2023-12-31_v1'), 345000);
  values.set(makeValueKey('SUBTOTAL_CurrentLiab', '2023-12-31_v1'), 1665000);
  values.set(makeValueKey('TOTAL_Liabilities', '2023-12-31_v1'), 1665000);

  values.set(makeValueKey('Asset.Current.Cash', '2024-12-31_v1'), 890000);
  values.set(makeValueKey('Asset.Current.AR', '2024-12-31_v1'), 2850000);
  values.set(makeValueKey('Asset.Current.Inventory', '2024-12-31_v1'), 1250000);
  values.set(makeValueKey('SUBTOTAL_CurrentAssets', '2024-12-31_v1'), 4990000);
  values.set(makeValueKey('Asset.Fixed.PPE', '2024-12-31_v1'), 7100000);
  values.set(makeValueKey('Asset.Fixed.AccumDepr', '2024-12-31_v1'), -2100000);
  values.set(makeValueKey('SUBTOTAL_FixedAssets', '2024-12-31_v1'), 5000000);
  values.set(makeValueKey('TOTAL_Assets', '2024-12-31_v1'), 9990000);
  values.set(makeValueKey('Liability.Current.AP', '2024-12-31_v1'), 1480000);
  values.set(makeValueKey('Liability.Current.AccruedExp', '2024-12-31_v1'), 392000);
  values.set(makeValueKey('SUBTOTAL_CurrentLiab', '2024-12-31_v1'), 1872000);
  values.set(makeValueKey('TOTAL_Liabilities', '2024-12-31_v1'), 1872000);

  return values;
}

export const incomeStatementRows: RowDefinition[] = [
  { lineItemCode: 'IS.Revenue.NetSales', label: 'Net Sales / Revenue', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.Revenue.COGS', label: 'Cost of Goods Sold', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.Revenue.GrossProfit', label: 'Gross Profit', rowType: 'subtotal', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.spacer1', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.OpExp.Salaries', label: 'Salaries & Wages', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.OpExp.Rent', label: 'Rent', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.OpExp.Utilities', label: 'Utilities', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.OpExp.Other', label: 'Other Operating Expenses', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.OpExp.Total', label: 'Total Operating Expenses', rowType: 'subtotal', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.spacer2', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.OperatingIncome', label: 'Operating Income', rowType: 'subtotal', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.spacer3', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.Other.InterestExp', label: 'Interest Expense', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.Other.OtherIncome', label: 'Other Income', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.Other.Total', label: 'Total Other Income (Expense)', rowType: 'subtotal', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.spacer4', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.IncomeBeforeTax', label: 'Income Before Tax', rowType: 'subtotal', indentLevel: 0, isEditable: false },
  { lineItemCode: 'IS.IncomeTax', label: 'Income Tax', rowType: 'data', indentLevel: 1, isEditable: true },
  { lineItemCode: 'IS.NetIncome', label: 'Net Income', rowType: 'total', indentLevel: 0, isEditable: false },
];

export function createMockISValues(): Map<string, number> {
  const values = new Map<string, number>();
  const periods = ['2022-12-31_v1', '2023-12-31_v1', '2024-12-31_v1'];

  const data: Record<string, number[]> = {
    'IS.Revenue.NetSales':    [18000000, 20000000, 22500000],
    'IS.Revenue.COGS':        [13500000, 15000000, 16200000],
    'IS.OpExp.Salaries':      [2400000,  3000000,  3300000],
    'IS.OpExp.Rent':          [720000,   800000,   840000],
    'IS.OpExp.Utilities':     [340000,   400000,   420000],
    'IS.OpExp.Other':         [500000,   600000,   650000],
    'IS.Other.InterestExp':   [450000,   500000,   480000],
    'IS.Other.OtherIncome':   [180000,   200000,   220000],
    'IS.IncomeTax':           [950000,   1200000,  1400000],
  };

  for (const [code, amounts] of Object.entries(data)) {
    periods.forEach((pid, i) => {
      values.set(`${code}|${pid}`, amounts[i]);
    });
  }

  return values;
}