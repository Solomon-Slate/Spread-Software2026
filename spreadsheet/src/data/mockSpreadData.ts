/**
 * mockSpreadData.ts — Mock data using the spread.types.ts data model
 * 
 * Creates two entities with different business types to test:
 *   - Entity tab switching (different data per entity)
 *   - Different IS row templates (manufacturing vs real estate)
 *   - Combined view logic (matching lineItemCodes sum, non-matching carry over)
 * 
 * Entity 1: Acme Manufacturing, Inc. — traditional manufacturing company
 * Entity 2: ABC Inc. — real estate / rental entity
 * 
 * Both use calendar year (12/31) with 3 annual periods for simplicity.
 */

import {
    Entity,
    EntityMetadata,
    PeriodDefinition,
    RowDefinition,
    StatementData,
    StatementType,
    Group,
    CombineConfig,
    DisplaySettings,
    UserSession,
    AppState,
    CellHighlight,
    makeValueKey,
  } from '../types/spread.types';
  
  
  // ============================================================================
  // SHARED PERIODS — Both entities use calendar year 12/31
  // ============================================================================
  
  /** 
   * Creates standard 3-year annual periods.
   * Each entity gets its OWN copy (periods are per-entity). 
   */
  function createStandardPeriods(): PeriodDefinition[] {
    return [
      {
        periodId: '2022-12-31_v1',
        periodEnd: '2022-12-31',
        periodType: 'Y',
        isActive: true,
        isIncluded: true,
        metadata: {
          analystName: 'Dev User',
          statementDate: '2022-12-31',
          statementQuality: 'companyPrepared',
          monthsInPeriod: 12,
          notes: '',
        },
      },
      {
        periodId: '2023-12-31_v1',
        periodEnd: '2023-12-31',
        periodType: 'Y',
        isActive: true,
        isIncluded: true,
        metadata: {
          analystName: 'Dev User',
          statementDate: '2023-12-31',
          statementQuality: 'companyPrepared',
          monthsInPeriod: 12,
          notes: '',
        },
      },
      {
        periodId: '2024-12-31_v1',
        periodEnd: '2024-12-31',
        periodType: 'Y',
        isActive: true,
        isIncluded: true,
        metadata: {
          analystName: 'Dev User',
          statementDate: '2024-12-31',
          statementQuality: 'companyPrepared',
          monthsInPeriod: 12,
          notes: '',
        },
      },
    ];
  }
  
  
  // ============================================================================
  // BALANCE SHEET — Shared row template (both entities use same BS structure)
  // ============================================================================
  
  /**
   * Standard balance sheet row template.
   * Both entities use this same structure — in real usage, entities CAN
   * have different BS rows, but for initial testing we keep them the same
   * so combined view summing is straightforward to verify.
   */
  function createBSRows(): RowDefinition[] {
    return [
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
  }
  // ============================================================================
// INCOME STATEMENT — Different row templates per entity type
// ============================================================================

/**
 * Manufacturing income statement rows (Acme Manufacturing).
 * Standard manufacturing pattern: Revenue → COGS → Gross Profit → OpEx → Net Income
 */
function createManufacturingISRows(): RowDefinition[] {
    return [
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
  }
  
  /**
   * Real estate income statement rows (ABC Inc.).
   * Rental property pattern: Rental Income → Property Expenses → NOI → Interest → Net Income
   * 
   * KEY DIFFERENCE from manufacturing:
   *   - Revenue is IS.Revenue.RentalIncome and IS.Revenue.PropertyMgmtFees (not NetSales/COGS)
   *   - Operating expenses are property-specific: PropertyTaxes, Insurance, Maintenance
   *   - Some codes overlap with manufacturing (IS.Other.InterestExp) — these will SUM in combined view
   *   - Non-overlapping codes carry over independently in combined view
   */
  function createRealEstateISRows(): RowDefinition[] {
    return [
      { lineItemCode: 'IS.Revenue.RentalIncome', label: 'Rental Income', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.Revenue.PropertyMgmtFees', label: 'Property Management Fees', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.Revenue.GrossRevenue', label: 'Gross Revenue', rowType: 'subtotal', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.spacer1', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.OpExp.PropertyTaxes', label: 'Property Taxes', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.OpExp.Insurance', label: 'Insurance', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.OpExp.Maintenance', label: 'Repairs & Maintenance', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.OpExp.Utilities', label: 'Utilities', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.OpExp.Other', label: 'Other Operating Expenses', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.OpExp.Total', label: 'Total Operating Expenses', rowType: 'subtotal', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.spacer2', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.NOI', label: 'Net Operating Income (NOI)', rowType: 'subtotal', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.spacer3', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.Other.InterestExp', label: 'Interest Expense', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.Other.DepreciationAmort', label: 'Depreciation & Amortization', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.Other.Total', label: 'Total Other Expense', rowType: 'subtotal', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.spacer4', label: '', rowType: 'spacer', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.IncomeBeforeTax', label: 'Income Before Tax', rowType: 'subtotal', indentLevel: 0, isEditable: false },
      { lineItemCode: 'IS.IncomeTax', label: 'Income Tax', rowType: 'data', indentLevel: 1, isEditable: true },
      { lineItemCode: 'IS.NetIncome', label: 'Net Income', rowType: 'total', indentLevel: 0, isEditable: false },
    ];
  }
  // ============================================================================
// ACME MANUFACTURING — Value Population
// ============================================================================

/** Acme Manufacturing BS values — identical to current mockData.ts */
function createAcmeBSValues(): Map<string, number> {
    const v = new Map<string, number>();
    const k = makeValueKey;
  
    // 2022
    v.set(k('Asset.Current.Cash', '2022-12-31_v1'), 618000);
    v.set(k('Asset.Current.AR', '2022-12-31_v1'), 2332000);
    v.set(k('Asset.Current.Inventory', '2022-12-31_v1'), 980000);
    v.set(k('SUBTOTAL_CurrentAssets', '2022-12-31_v1'), 3930000);
    v.set(k('Asset.Fixed.PPE', '2022-12-31_v1'), 5800000);
    v.set(k('Asset.Fixed.AccumDepr', '2022-12-31_v1'), -1450000);
    v.set(k('SUBTOTAL_FixedAssets', '2022-12-31_v1'), 4350000);
    v.set(k('TOTAL_Assets', '2022-12-31_v1'), 8280000);
    v.set(k('Liability.Current.AP', '2022-12-31_v1'), 1150000);
    v.set(k('Liability.Current.AccruedExp', '2022-12-31_v1'), 298000);
    v.set(k('SUBTOTAL_CurrentLiab', '2022-12-31_v1'), 1448000);
    v.set(k('TOTAL_Liabilities', '2022-12-31_v1'), 1448000);
  
    // 2023
    v.set(k('Asset.Current.Cash', '2023-12-31_v1'), 725000);
    v.set(k('Asset.Current.AR', '2023-12-31_v1'), 2580000);
    v.set(k('Asset.Current.Inventory', '2023-12-31_v1'), 1100000);
    v.set(k('SUBTOTAL_CurrentAssets', '2023-12-31_v1'), 4405000);
    v.set(k('Asset.Fixed.PPE', '2023-12-31_v1'), 6400000);
    v.set(k('Asset.Fixed.AccumDepr', '2023-12-31_v1'), -1750000);
    v.set(k('SUBTOTAL_FixedAssets', '2023-12-31_v1'), 4650000);
    v.set(k('TOTAL_Assets', '2023-12-31_v1'), 9055000);
    v.set(k('Liability.Current.AP', '2023-12-31_v1'), 1320000);
    v.set(k('Liability.Current.AccruedExp', '2023-12-31_v1'), 345000);
    v.set(k('SUBTOTAL_CurrentLiab', '2023-12-31_v1'), 1665000);
    v.set(k('TOTAL_Liabilities', '2023-12-31_v1'), 1665000);
  
    // 2024
    v.set(k('Asset.Current.Cash', '2024-12-31_v1'), 890000);
    v.set(k('Asset.Current.AR', '2024-12-31_v1'), 2850000);
    v.set(k('Asset.Current.Inventory', '2024-12-31_v1'), 1250000);
    v.set(k('SUBTOTAL_CurrentAssets', '2024-12-31_v1'), 4990000);
    v.set(k('Asset.Fixed.PPE', '2024-12-31_v1'), 7100000);
    v.set(k('Asset.Fixed.AccumDepr', '2024-12-31_v1'), -2100000);
    v.set(k('SUBTOTAL_FixedAssets', '2024-12-31_v1'), 5000000);
    v.set(k('TOTAL_Assets', '2024-12-31_v1'), 9990000);
    v.set(k('Liability.Current.AP', '2024-12-31_v1'), 1480000);
    v.set(k('Liability.Current.AccruedExp', '2024-12-31_v1'), 392000);
    v.set(k('SUBTOTAL_CurrentLiab', '2024-12-31_v1'), 1872000);
    v.set(k('TOTAL_Liabilities', '2024-12-31_v1'), 1872000);
  
    return v;
  }
  
  /** Acme Manufacturing IS values — identical to current mockData.ts */
  function createAcmeISValues(): Map<string, number> {
    const v = new Map<string, number>();
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
        v.set(makeValueKey(code, pid), amounts[i]);
      });
    }
  
    return v;
  }
  // ============================================================================
// ABC INC. — Value Population (Real Estate Entity)
// ============================================================================

/**
 * ABC Inc. BS values — same lineItemCodes as Acme but different amounts.
 * Smaller entity (typical for a rental property holding company).
 * Values are intentionally distinct so you can immediately tell which entity
 * is displayed: e.g., ABC Cash ~150k-250k vs Acme Cash ~618k-890k.
 */
function createAbcBSValues(): Map<string, number> {
    const v = new Map<string, number>();
    const k = makeValueKey;
  
    // 2022
    v.set(k('Asset.Current.Cash', '2022-12-31_v1'), 152000);
    v.set(k('Asset.Current.AR', '2022-12-31_v1'), 85000);
    v.set(k('Asset.Current.Inventory', '2022-12-31_v1'), 0);
    v.set(k('SUBTOTAL_CurrentAssets', '2022-12-31_v1'), 237000);
    v.set(k('Asset.Fixed.PPE', '2022-12-31_v1'), 3200000);
    v.set(k('Asset.Fixed.AccumDepr', '2022-12-31_v1'), -480000);
    v.set(k('SUBTOTAL_FixedAssets', '2022-12-31_v1'), 2720000);
    v.set(k('TOTAL_Assets', '2022-12-31_v1'), 2957000);
    v.set(k('Liability.Current.AP', '2022-12-31_v1'), 42000);
    v.set(k('Liability.Current.AccruedExp', '2022-12-31_v1'), 18000);
    v.set(k('SUBTOTAL_CurrentLiab', '2022-12-31_v1'), 60000);
    v.set(k('TOTAL_Liabilities', '2022-12-31_v1'), 60000);
  
    // 2023
    v.set(k('Asset.Current.Cash', '2023-12-31_v1'), 198000);
    v.set(k('Asset.Current.AR', '2023-12-31_v1'), 92000);
    v.set(k('Asset.Current.Inventory', '2023-12-31_v1'), 0);
    v.set(k('SUBTOTAL_CurrentAssets', '2023-12-31_v1'), 290000);
    v.set(k('Asset.Fixed.PPE', '2023-12-31_v1'), 3200000);
    v.set(k('Asset.Fixed.AccumDepr', '2023-12-31_v1'), -576000);
    v.set(k('SUBTOTAL_FixedAssets', '2023-12-31_v1'), 2624000);
    v.set(k('TOTAL_Assets', '2023-12-31_v1'), 2914000);
    v.set(k('Liability.Current.AP', '2023-12-31_v1'), 38000);
    v.set(k('Liability.Current.AccruedExp', '2023-12-31_v1'), 21000);
    v.set(k('SUBTOTAL_CurrentLiab', '2023-12-31_v1'), 59000);
    v.set(k('TOTAL_Liabilities', '2023-12-31_v1'), 59000);
  
    // 2024
    v.set(k('Asset.Current.Cash', '2024-12-31_v1'), 245000);
    v.set(k('Asset.Current.AR', '2024-12-31_v1'), 105000);
    v.set(k('Asset.Current.Inventory', '2024-12-31_v1'), 0);
    v.set(k('SUBTOTAL_CurrentAssets', '2024-12-31_v1'), 350000);
    v.set(k('Asset.Fixed.PPE', '2024-12-31_v1'), 3200000);
    v.set(k('Asset.Fixed.AccumDepr', '2024-12-31_v1'), -672000);
    v.set(k('SUBTOTAL_FixedAssets', '2024-12-31_v1'), 2528000);
    v.set(k('TOTAL_Assets', '2024-12-31_v1'), 2878000);
    v.set(k('Liability.Current.AP', '2024-12-31_v1'), 35000);
    v.set(k('Liability.Current.AccruedExp', '2024-12-31_v1'), 24000);
    v.set(k('SUBTOTAL_CurrentLiab', '2024-12-31_v1'), 59000);
    v.set(k('TOTAL_Liabilities', '2024-12-31_v1'), 59000);
  
    return v;
  }
  
  /**
   * ABC Inc. IS values — real estate pattern.
   * Revenue is rental income + property management fees.
   * OpEx is property-specific: taxes, insurance, maintenance.
   * Note: IS.Other.InterestExp and IS.OpExp.Utilities overlap with Acme —
   * these will SUM in the combined view. All other IS codes are unique to ABC.
   */
  function createAbcISValues(): Map<string, number> {
    const v = new Map<string, number>();
    const periods = ['2022-12-31_v1', '2023-12-31_v1', '2024-12-31_v1'];
  
    const data: Record<string, number[]> = {
      'IS.Revenue.RentalIncome':      [840000,  870000,  910000],
      'IS.Revenue.PropertyMgmtFees':  [36000,   38000,   40000],
      'IS.OpExp.PropertyTaxes':       [95000,   98000,   102000],
      'IS.OpExp.Insurance':           [42000,   44000,   46000],
      'IS.OpExp.Maintenance':         [65000,   58000,   72000],
      'IS.OpExp.Utilities':           [28000,   30000,   32000],
      'IS.OpExp.Other':               [15000,   16000,   18000],
      'IS.Other.InterestExp':         [180000,  175000,  170000],
      'IS.Other.DepreciationAmort':   [96000,   96000,   96000],
      'IS.IncomeTax':                 [71000,   80000,   85000],
    };
  
    for (const [code, amounts] of Object.entries(data)) {
      periods.forEach((pid, i) => {
        v.set(makeValueKey(code, pid), amounts[i]);
      });
    }
  
    return v;
  }
  // ============================================================================
// ENTITY BUILDERS
// ============================================================================

/** Helper: creates an empty StatementData shell for CF (not yet implemented) */
function createEmptyCFStatement(): StatementData {
    return {
      statementType: 'CF',
      rows: [],
      values: new Map(),
      highlights: new Map(),
      comments: new Map(),
    };
  }
  
  /** Build the complete Acme Manufacturing entity */
  function createAcmeEntity(): Entity {
    return {
      entityId: 'entity_acme',
      metadata: {
        borrowerName: 'Acme Manufacturing, Inc.',
        taxId: '12-3456789',
        industryNAICS: '332710',
        portfolioIds: ['portfolio_commercial'],
      },
      periods: createStandardPeriods(),
      statements: {
        BS: {
          statementType: 'BS',
          rows: createBSRows(),
          values: createAcmeBSValues(),
          highlights: new Map(),
          comments: new Map(),
        },
        IS: {
          statementType: 'IS',
          rows: createManufacturingISRows(),
          values: createAcmeISValues(),
          highlights: new Map(),
          comments: new Map(),
        },
        CF: createEmptyCFStatement(),
      },
    };
  }
  
  /** Build the complete ABC Inc. entity */
  function createAbcEntity(): Entity {
    return {
      entityId: 'entity_abc',
      metadata: {
        borrowerName: 'ABC Inc.',
        taxId: '98-7654321',
        industryNAICS: '531110',
        portfolioIds: ['portfolio_realestate'],
      },
      periods: createStandardPeriods(),
      statements: {
        BS: {
          statementType: 'BS',
          rows: createBSRows(),
          values: createAbcBSValues(),
          highlights: new Map(),
          comments: new Map(),
        },
        IS: {
          statementType: 'IS',
          rows: createRealEstateISRows(),
          values: createAbcISValues(),
          highlights: new Map(),
          comments: new Map(),
        },
        CF: createEmptyCFStatement(),
      },
    };
  }
  
  
  // ============================================================================
  // EXPORTED: Complete mock application state
  // ============================================================================
  
  /** Default display settings */
  export const mockDisplaySettings: DisplaySettings = {
    negativeFormat: 'parentheses',
    displayScale: 'units',
    dateFormat: 'MM/DD/YYYY',
  };
  
  /** Mock user session */
  export const mockCurrentUser: UserSession = {
    userId: 'dev_user_1',
    userName: 'Dev User',
    role: 'admin',
  };
  
  /** The mock group containing both entities */
  export const mockGroup: Group = {
    groupId: 'group_demo',
    groupName: 'Demo Lending Relationship',
    relationshipManager: 'Dev User',
    entityIds: ['entity_acme', 'entity_abc'],
    combineConfig: {
      includedEntityIds: ['entity_acme', 'entity_abc'],
      warnings: [],
    },
  };
  
  /** All mock entities as a Map keyed by entityId */
  export const mockEntities: Map<string, Entity> = new Map([
    ['entity_acme', createAcmeEntity()],
    ['entity_abc', createAbcEntity()],
  ]);
  
  /**
   * Complete initial AppState — use this to initialize App.tsx state.
   * 
   * Usage in App.tsx:
   *   const [appState, setAppState] = useState<AppState>(createInitialAppState());
   * 
   * Or destructure into individual useState calls (see Step 2 instructions).
   */
  export function createInitialAppState(): AppState {
    return {
      activeGroup: mockGroup,
      entities: mockEntities,
      activeEntityId: 'entity_acme',
      activeStatement: 'BS',
      isCombinedActive: false,
      displaySettings: mockDisplaySettings,
      currentUser: mockCurrentUser,
    };
  }
  