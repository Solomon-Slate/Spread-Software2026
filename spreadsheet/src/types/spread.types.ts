/**
 * spread.types.ts — Core Data Model for J-Spread
 * 
 * Defines the hierarchical data structure: Group → Entity → Statement → Values.
 * This is the frontend state shape. It mirrors how data will eventually be stored
 * in the backend database, making the future API integration straightforward.
 * 
 * KEY PRINCIPLE: The grid is an input/output interface, not the data model.
 * Real data is tagged values. Each value knows WHAT it is (lineItemCode),
 * WHEN it is (periodId), and WHO it belongs to (entityId). Analysis is driven
 * by tags and queries against those tags — never by grid row position.
 * 
 * However, row position within a SECTION does matter for one reason:
 * it determines which subtotal a value rolls into. Moving A/R from Current Assets
 * to Term Assets changes its classification tag — that's a substantive analytical
 * decision, not just cosmetic rearrangement. Validation rules (defined separately)
 * govern which sections an account is permitted to move into.
 */


// ============================================================================
// STATEMENT TYPES
// ============================================================================

/** The three financial statement types in commercial spreading */
export type StatementType = 'BS' | 'IS' | 'CF';

// ============================================================================
// USER ROLES & PERMISSIONS
// ============================================================================

/**
 * User roles control what actions are available in the UI.
 * 
 * Admin:   Full control — can restructure templates, create entities, manage groups.
 * Analyst: Can enter and edit data, modify period metadata. Cannot restructure accounts.
 * Viewer:  Read-only access with export capability. Used for loan committee review, auditors, etc.
 */
export type UserRole = 'admin' | 'analyst' | 'viewer';

/**
 * Current user session info. In production this comes from authentication.
 * For now we use a mock user during development.
 */
export interface UserSession {
  userId: string;
  userName: string;
  role: UserRole;
}

// ============================================================================
// PERIOD DEFINITIONS
// ============================================================================

/**
 * Granularity of a financial reporting period.
 * 
 * D = Daily (rare, used for some cash-basis tracking)
 * M = Monthly
 * Q = Quarterly
 * Y = Annual (most common for commercial borrowers)
 * 
 * Different entities may report at different granularities.
 * A corporation may provide annual audited statements while a related LLC
 * provides quarterly company-prepared statements.
 */
export type PeriodType = 'D' | 'M' | 'Q' | 'Y';

/**
 * Quality/source of the financial statement for a given period.
 * This is critical metadata in commercial lending — a CPA-audited statement
 * carries far more weight than a company-prepared interim statement.
 * Listed roughly in order of reliability.
 */
export type StatementQuality =
  | 'audited'           // CPA audited — highest reliability
  | 'reviewed'          // CPA reviewed — moderate assurance
  | 'compiled'          // CPA compiled — minimal assurance, no opinion
  | 'taxReturn'         // Based on filed tax return
  | 'companyPrepared'   // Borrower's own internal statements
  | 'interim'           // Mid-year or mid-quarter partial period
  | 'proForma';         // Projected / hypothetical — not historical

/**
 * Metadata about a specific period column.
 * This information appears in the header area above each period's data column
 * and is critical for the analyst's assessment of the data quality.
 */
export interface PeriodMetadata {
  /** Name of the analyst who spread this period */
  analystName: string;

  /** Date printed on the actual financial statement (may differ from periodEnd) */
  statementDate: string;

  /** Quality/source classification — drives how much weight analysis gives this data */
  statementQuality: StatementQuality;

  /**
   * Number of months covered by this period.
   * 12 for annual, 3 for quarterly, etc.
   * IMPORTANT for combine tab: summing a 12-month entity with a 3-month entity
   * is usually a mistake — the system warns about this mismatch.
   */
  monthsInPeriod: number;

  /** Free-form analyst notes about this period (data quality concerns, adjustments made, etc.) */
  notes: string;
}

/**
 * A single period instance for an entity.
 * 
 * Periods are OWNED BY the entity — Entity A with calendar year (12/31)
 * and Entity B with fiscal year (6/30) each have their own independent period arrays.
 * 
 * VARIANTS: Multiple versions of the same period date can exist.
 * Example: "12/31/2024 — Company Prepared" entered first, then 
 * "12/31/2024 — CPA Reviewed" entered later when the audit is complete.
 * Only one variant per date is marked "active" for analysis at a time.
 */
export interface PeriodDefinition {
  /** System-generated unique ID. This is the primary key — never changes once created. */
  periodId: string;

  /** The period end date in ISO format, e.g., "2024-12-31" */
  periodEnd: string;

  /** Reporting granularity */
  periodType: PeriodType;

  /**
   * Optional label distinguishing this variant from others with the same periodEnd.
   * Examples: "CPA Reviewed", "Company Prepared", "Pro Forma", "What-If Scenario"
   * If undefined, this is the original/only version for this date.
   */
  variant?: string;

  /**
   * Whether this variant is the "official" one for its period date.
   * Exactly one variant per periodEnd must be active at all times.
   * The active variant is what feeds into analysis, ratios, cash flow derivation,
   * and the combine tab. Inactive variants are retained for comparison.
   */
  isActive: boolean;

  /**
   * Whether this period is currently included in the analysis view.
   * Different from isActive: a period can be active (it's the official version)
   * but excluded from the current analysis (e.g., user only wants to see last 3 years).
   */
  isIncluded: boolean;

  /** Period-level metadata (analyst, quality, dates, notes) */
  metadata: PeriodMetadata;
}


// ============================================================================
// ROW DEFINITIONS
// ============================================================================

/**
 * Visual and functional classification of a row in the grid.
 * 
 * data:          Normal editable row — represents a single account/line item
 * subtotal:      Computed sum of rows in its section. Bold, light background.
 * total:         Major total (e.g., Total Assets). Bold, darker background, double border.
 * sectionHeader: Non-editable label row that introduces a group of accounts (e.g., "ASSETS")
 * spacer:        Empty row for visual separation between sections
 */
export type RowType = 'data' | 'subtotal' | 'total' | 'sectionHeader' | 'spacer';

/**
 * Definition of a single row in a statement grid.
 * 
 * Rows represent accounts (line items) in the financial statement.
 * The row's position within a section determines which subtotal it rolls into.
 * Moving a row between sections is a RECLASSIFICATION that changes the account's
 * classification tag — this is a substantive analytical decision with validation rules.
 * 
 * Row definitions are PER ENTITY PER STATEMENT. Two entities can have completely
 * different row structures. Commercial borrowers across different industries may have
 * very different chart of accounts. Templates provide a starting point but are not enforced.
 */
export interface RowDefinition {
  /**
   * Dot-notation taxonomy code that uniquely identifies what this account IS.
   * This is the semantic tag that drives all analysis, cash flow derivation,
   * combining, and ratio computation.
   * 
   * Examples:
   *   Balance Sheet:  "Asset.Current.Tangible.AR.Trade"
   *   Income Stmt:    "IS.OpExp.Salaries"
   *   Cash Flow:      "CF.Operating.WorkingCapital.AR"
   * 
   * When a row is moved between sections (reclassification), this code updates
   * to reflect the new classification.
   */
  lineItemCode: string;

  /** Display label shown in the row header. User can rename for clarity. */
  label: string;

  /** Visual and functional type of this row */
  rowType: RowType;

  /** Indentation level for visual hierarchy (0 = flush left, 1 = one indent, etc.) */
  indentLevel: number;

  /** Whether the user can type values into this row's cells */
  isEditable: boolean;

  /**
   * For cash flow rows: the formula that derives this row's values from BS and IS data.
   * Uses lineItemCode references, e.g., "delta(Asset.Current.AR)" means
   * "change in A/R between periods" (prior period minus current period).
   * 
   * Undefined for BS and IS rows where the user enters values directly.
   */
  sourceFormula?: string;

  /**
   * When true, this row visually consolidates multiple child rows into one display line.
   * The underlying child values still exist in the data — this is purely a presentation choice.
   * 
   * Example: Three inventory accounts (Raw, WIP, Finished) consolidated into one 
   * "Inventory" row for cleaner presentation. The value shown is the sum of children.
   */
  isConsolidated?: boolean;

  /**
   * When isConsolidated is true, these are the lineItemCodes of the child rows
   * that are rolled into this consolidated display row.
   * The child rows are hidden from display but their values remain in the data store.
   */
  consolidatedChildren?: string[];

  /**
   * Which sections this account is permitted to exist in.
   * Enforced when a user attempts to move/reclassify a row.
   * 
   * Example: An A/R account might have ['Asset.Current', 'Asset.Term']
   * meaning it can be reclassified between current and term assets,
   * but cannot be moved into liabilities or equity.
   * 
   * Some accounts have exceptions (e.g., intangible assets can become negative equity).
   * These exception rules will be defined in a separate reclassification rules document.
   * 
   * Undefined means no restriction (custom user-created accounts).
   */
  permittedSections?: string[];
}


// ============================================================================
// CELL-LEVEL DATA (Value Intersections)
// ============================================================================

/**
 * Highlight colors available for cell font.
 * Used by analysts to flag items for attention during review.
 */
export type FontHighlight = 'red' | 'green' | 'blue' | null;

/**
 * Highlight colors available for cell background.
 * Used for visual emphasis — e.g., yellow for "needs verification",
 * orange for "significant change from prior period".
 */
export type BackgroundHighlight = 'orange' | 'yellow' | 'pink' | null;

/**
 * Visual formatting applied to a specific cell.
 * These are attributes of the VALUE at a specific row × period intersection.
 * They belong to a specific statement on a specific entity.
 * They do NOT carry over to other statements, other entities, or the combined view.
 */
export interface CellHighlight {
  fontHighlight: FontHighlight;
  backgroundHighlight: BackgroundHighlight;
  boldBorder: boolean;
}


// ============================================================================
// STATEMENT DATA — The core container for one statement on one entity
// ============================================================================

/**
 * All data for a single financial statement (BS, IS, or CF) on a single entity.
 * 
 * This is the self-contained unit that the grid component receives.
 * It holds everything needed to display and edit one statement:
 * the row structure, the values, and all cell-level attributes.
 * 
 * Each entity has its own independent StatementData for each statement type.
 * Row structures can differ completely across entities (different industries,
 * different account detail levels, etc.).
 */
export interface StatementData {
  /** Which statement this is */
  statementType: StatementType;

  /**
   * The rows (accounts) for this statement, in display order.
   * This array defines what the user sees and is per-entity — two entities
   * may have very different row structures for the same statement type.
   */
  rows: RowDefinition[];

  /**
   * The actual numeric values, keyed by "lineItemCode|periodId".
   * This is the real data. Everything else (grid position, highlights, etc.)
   * is metadata about these values.
   */
  values: Map<string, number>;

  /**
   * Cell-level visual formatting, keyed by "lineItemCode|periodId".
   * Specific to this statement on this entity.
   * Does NOT propagate to other statements, entities, or combined view.
   */
  highlights: Map<string, CellHighlight>;

  /**
   * Cell-level analyst comments, keyed by "lineItemCode|periodId".
   * Used for audit trail, review notes, questions about specific values.
   * Specific to this statement on this entity — a question about Entity A's A/R
   * has nothing to do with Entity B's A/R.
   */
  comments: Map<string, string>;
}


// ============================================================================
// ENTITY — The atomic unit of the platform
// ============================================================================

/**
 * Metadata about an entity that lives at the entity level, not per-period.
 * This is the "who" information — identifies the borrower/company.
 */
export interface EntityMetadata {
  /** Legal name of the business entity */
  borrowerName: string;

  /**
   * Federal Tax ID (EIN for businesses, SSN for individuals).
   * This is the business key used for deduplication and matching.
   * The system-generated entityId is the primary reference, but taxId
   * is how bankers identify and search for entities.
   */
  taxId: string;

  /**
   * NAICS industry classification code.
   * Used for portfolio analysis and industry benchmarking.
   */
  industryNAICS: string;

  /** IDs of portfolios this entity belongs to (many-to-many relationship) */
  portfolioIds: string[];
}

/**
 * A single business entity — the atomic unit of the entire platform.
 * 
 * Everything in J-Spread ultimately belongs to an entity: periods, statements,
 * values, highlights, comments. An entity is identified by a system-generated
 * unique ID (entityId) and a business key (taxId).
 * 
 * Entities can belong to multiple groups and multiple portfolios.
 * Example: A joint venture entity might appear in two different borrower groups,
 * and simultaneously be tagged to both a "Commercial Real Estate" portfolio
 * and a "Construction" portfolio.
 * 
 * Each entity owns its own periods (fiscal year can differ across entities)
 * and its own statement data (row structures can differ across entities).
 */
export interface Entity {
  /** System-generated unique identifier. Never changes once created. Primary key. */
  entityId: string;

  /** Entity-level metadata (name, tax ID, industry, portfolios) */
  metadata: EntityMetadata;

  /**
   * This entity's reporting periods.
   * Per-entity because different entities may have different fiscal years.
   * Entity A might report 12/31, Entity B might report 6/30.
   * Each period can have multiple variants (company-prepared vs CPA-reviewed).
   */
  periods: PeriodDefinition[];

  /**
   * Financial statement data, keyed by statement type.
   * Each statement holds its own rows, values, highlights, and comments.
   * 
   * BS and IS contain user-entered data.
   * CF is DERIVED from BS and IS — the derivation engine computes CF values
   * from the changes in BS accounts and IS flow items.
   */
  statements: Record<StatementType, StatementData>;
}


// ============================================================================
// GROUP — Collection of entities loaded into the workspace
// ============================================================================

/**
 * Configuration for the combined view within a group.
 * 
 * Combined view sums matching lineItemCodes across selected entities.
 * Combined cash flow is derived from the combined BS and IS —
 * NOT by summing individual entity cash flows (which could give different results).
 */
export interface CombineConfig {
  /**
   * Which entities are included in the combined view.
   * Can be all, some, or none (empty = combined tab shows nothing).
   * User selects via checkboxes or similar UI.
   */
  includedEntityIds: string[];

  /**
   * Warnings generated by the combine logic.
   * These alert the analyst to potential issues with the combined data.
   */
  warnings: CombineWarning[];
}

/**
 * A warning generated when combining entities reveals data mismatches.
 * These are informational — they don't prevent combining, they alert the analyst.
 */
export interface CombineWarning {
  /** What kind of mismatch was detected */
  type: 'periodMismatch' | 'monthsMismatch' | 'missingData';

  /** Human-readable description of the issue */
  message: string;

  /** Which entities are involved in this warning */
  affectedEntityIds: string[];

  /** Which period date triggered the warning, if applicable */
  periodEnd?: string;
}

/**
 * A group is a named collection of entity references.
 * 
 * The group determines which entities are loaded into the workspace
 * and displayed across the entity tabs. It represents a lending relationship —
 * typically all the entities associated with one borrower or one loan package.
 * 
 * Groups are unique but an entity can belong to more than one group.
 * Example: A holding company (Group 1) has three subsidiaries. One subsidiary
 * is a joint venture that also appears in a different borrower's group (Group 2).
 */
export interface Group {
  /** System-generated unique identifier for this group */
  groupId: string;

  /** Display name, e.g., "Smith Holdings — Operating Entities" */
  groupName: string;

  /** Relationship manager or loan officer responsible for this group */
  relationshipManager?: string;

  /**
   * Ordered list of entity IDs in this group.
   * Order determines tab display order. Can be rearranged by user.
   */
  entityIds: string[];

  /** Configuration for the combined view */
  combineConfig: CombineConfig;
}


// ============================================================================
// APPLICATION STATE — Top-level state shape
// ============================================================================

/**
 * Display settings that apply globally across the entire workspace.
 * These are user preferences, not data attributes.
 * All entities and statements render using the same display settings.
 */
export interface DisplaySettings {
  /** How negative numbers are shown: (1,093) vs -1,093 */
  negativeFormat: NegativeDisplayFormat;

  /** Value scaling: show raw, thousands, millions, or forced decimal */
  displayScale: DisplayScale;

  /** Date column header format */
  dateFormat: DateDisplayFormat;
}

export type NegativeDisplayFormat = 'parentheses' | 'minus';
export type DisplayScale = 'decimal' | 'units' | 'thousands' | 'millions';
export type DateDisplayFormat = 'MM/DD/YYYY' | 'MM/DD/YY' | 'MM/YY';

/**
 * The complete application state.
 * 
 * This is the top-level shape of all data in the frontend.
 * Currently populated with mock data; will eventually be loaded from 
 * the C# backend via API calls.
 * 
 * The state is organized around the hierarchy:
 *   Group → Entities → Statements → Values
 * 
 * Navigation state (which entity/statement is active) is separate from data.
 * Display settings are global preferences, not per-entity.
 */
export interface AppState {
  /** The currently loaded group (determines which entities are available) */
  activeGroup: Group;

  /** All entities in the current group, keyed by entityId for fast lookup */
  entities: Map<string, Entity>;

  /** Which entity tab is currently selected */
  activeEntityId: string;

  /** Which statement tab is currently selected */
  activeStatement: StatementType;

  /** Whether the combined view tab is active instead of an individual entity */
  isCombinedActive: boolean;

  /** Global display preferences */
  displaySettings: DisplaySettings;

  /** Current user session (for permission checks) */
  currentUser: UserSession;
}


// ============================================================================
// CELL CHANGE EVENT — Used by the grid to report edits back to App
// ============================================================================

/**
 * Represents a single cell value change in the grid.
 * The grid emits these when a user edits a cell.
 * App-level handlers use these to update the correct entity's statement data.
 */
export interface CellChange {
  lineItemCode: string;
  periodId: string;
  oldValue: number | null;
  newValue: number | null;
}

/**
 * Grid position reference for keyboard navigation and focus tracking.
 */
export interface CellPosition {
  rowIndex: number;
  colIndex: number;
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Creates the standard key used for value, highlight, and comment Maps */
export function makeValueKey(lineItemCode: string, periodId: string): string {
  return `${lineItemCode}|${periodId}`;
}

/** Formats a period end date string for display in column headers */
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
 * Checks for period dates that have variants but none marked as active.
 * This is a data integrity issue — every date with variants must have exactly one active.
 * Used to display warnings in the UI.
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
