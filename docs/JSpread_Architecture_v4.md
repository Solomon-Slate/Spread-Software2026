# J-Spread — Architecture Document v4.0
## Commercial Financial Spreading Platform

*Last updated: February 28, 2026*
*For use as LLM context when starting new development threads*

---

## 1. WHAT THIS IS

Commercial bank financial spreading software. Users enter financial statements (balance sheet, income statement), the system derives cash flow statements, tags every value with semantic metadata, and runs flexible analysis. Web + desktop (shared backend). Designed for 10+ year maintainability with minimal dependencies.

---

## 2. TECH STACK

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Backend | C# / ASP.NET Core (Monolith) | Enterprise trust, strong typing, self-contained .exe |
| Database | PostgreSQL or SQL Server | Normalized fact table, relational integrity |
| Frontend | React + TypeScript | Custom grid (no third-party grid libraries) |
| Desktop | C# WebView2 wrapper | Shares React UI + C# engine |
| Charts | Apache ECharts | Free, high-quality |
| Excel Export | ClosedXML (MIT license) | Server-side .xlsx generation |

---

## 3. CORE CONCEPT — TAGGED FINANCIAL DATA

Every entered value carries metadata that drives all downstream analysis:

- **Line Item Code**: `Asset.Current.Tangible.InclCapitalBaseYes.LiquidationYes.AR.Trade`
- **Period Tags**: Day/Month/Quarter/Year + period end date + months in period
- **Company Tags**: Portfolio membership, industry (NAICS), relationship manager
- **Custom Tags**: User-defined dimensions for custom analysis

Analysis = queries against tags. No hard-coded account names.

---

## 4. DATA HIERARCHY

```
Entity (atomic unit — identified by system-generated unique ID + tax ID)
  ├── Entity-level metadata (name, tax ID, industry, etc.)
  ├── Periods[] (owned by entity — each entity can have different fiscal dates)
  │     └── Period metadata (statement date, quality, analyst, months-in-period, notes)
  ├── Statements
  │     ├── Balance Sheet (rows + entered values)
  │     ├── Income Statement (rows + entered values)
  │     └── Cash Flow (rows + DERIVED values from BS/IS, multiple template types)
  └── Display settings per entity (common size, etc.)

Group (named collection of entity references)
  ├── Group-level metadata (group name, relationship manager)
  ├── Entity references[] (entities can belong to MULTIPLE groups)
  ├── Combine config (which entities to include, warnings for mismatches)
  └── Combined view (sum of matching line items across selected entities)

Portfolio (another dimension of collections — TWO levels planned)
  └── Entity references[] (entities can belong to MULTIPLE portfolios)
```

### Key Design Decisions:
- **Entity is the atomic unit.** System generates a unique ID when created. Tax ID is the business key but the system ID is the primary reference.
- **An entity can belong to multiple groups and multiple portfolios.** Example: a joint venture entity shared between two independent borrower groups.
- **Periods are per-entity, not global.** Entity A can be calendar year (12/31), Entity B can be fiscal year (6/30). This is normal in commercial lending.
- **Groups are just collections.** They reference entities but don't own them.
- **Portfolio has two levels** (structure TBD — may be portfolio/sub-portfolio or portfolio/segment).

---

## 5. ENTITY & GROUP RELATIONSHIPS

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Entity A   │     │  Entity B   │     │  Entity C   │
│  (Tax: xxx) │     │  (Tax: yyy) │     │  (Tax: zzz) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ├───── Group 1 ─────┤                   │
       │    (Borrower X)   │                   │
       │                   │                   │
       │                   ├───── Group 2 ─────┤
       │                   │  (Joint Venture)  │
       │                   │                   │
       ├───── Portfolio: Commercial RE ────────┤
       │                                       │
       └──────── Portfolio: Construction ──────┘
```

Entity B appears in both Group 1 and Group 2. Entities A and C share portfolio memberships. This is real-world commercial lending.

---

## 6. STATEMENT TYPES

### 6a. Balance Sheet
- User-entered data
- Standard row template with section headers, data rows, subtotals, totals
- Rows: Assets (current, fixed, other), Liabilities (current, long-term), Equity
- Common size: as % of Total Assets (default, standard)

### 6b. Income Statement
- User-entered data
- Rows: Revenue, COGS, Operating Expenses, Other Income/Expense, Taxes, Net Income
- Common size: as % of Total Revenue / Net Sales (default, standard)

### 6c. Cash Flow Statement
- **DERIVED** — computed from BS and IS, not directly entered
- User can reorder rows, consolidate/unconsolidate line items
- **Four template types:**
  1. **Indirect Method** — Standard GAAP. Start with net income, adjust for non-cash, working capital changes.
  2. **UCA (Uniform Credit Analysis)** — Banking standard. Focuses on cash from operations vs. debt service.
  3. **Custom (Jay's proprietary)** — Specialized template that has been a key differentiator.
  4. **User-Created** — Blank template, user defines their own row arrangement.
- All four methods produce the same ending cash — they're just different arrangements of the same derived values.
- Common size: as % of (a) Beginning Cash, or (b) Beginning Cash + EBITDA — **user selects which**

### Cash Flow Template Architecture:
A cash flow template is a named set of row definitions, each with:
- `lineItemCode` and `label` (display)
- `sourceFormula` — references BS/IS line item codes (e.g., `delta(Asset.Current.AR)`, `IS.DepreciationAmort`)
- `isConsolidated` — user can collapse multiple lines into one
- `consolidatedChildren` — which lineItemCodes are rolled into this row when consolidated

The four built-in templates are predefined instances. User-created templates follow the same structure.

---

## 7. PERIOD DEFINITIONS

### Period-Level Fields (per period, per entity):
```typescript
interface PeriodDefinition {
  periodId: string;              // System-generated unique ID
  periodEnd: string;             // "2024-12-31"
  periodType: 'D' | 'M' | 'Q' | 'Y';
  variant?: string;              // "CPA Reviewed", "Pro Forma", etc.
  isActive: boolean;             // Which variant is the "active" one
  isIncluded: boolean;           // Include in analysis
  metadata: PeriodMetadata;
}
```

### Period Metadata (the header above each period column):
```typescript
interface PeriodMetadata {
  analystName: string;
  statementDate: string;         // Date on the actual financial statement
  statementQuality: StatementQuality;  // audited | reviewed | compiled | taxReturn | companyPrepared | interim | proForma
  monthsInPeriod: number;        // 3 for quarterly, 12 for annual
  notes: string;                 // Free-form analyst notes
}
```

### Entity-Level Metadata (lives on entity, not period):
```typescript
interface EntityMetadata {
  borrowerName: string;
  taxId: string;
  industryNAICS: string;
  portfolioIds: string[];        // Can belong to multiple portfolios
}
```

### Period Variants:
Multiple versions of the same period date (e.g., "12/31/2024 — Company Prepared" vs "12/31/2024 — CPA Reviewed"). Only one variant is "active" at a time for analysis. Others are retained for comparison. Clone or blank insert supported.

---

## 8. USER PERMISSIONS

Three roles with granular capabilities:

| Capability | Admin | Analyst | Viewer |
|-----------|-------|---------|--------|
| View & navigate | ✓ | ✓ | ✓ |
| Export (Excel/PDF) | ✓ | ✓ | ✓ |
| Enter/edit cell values | ✓ | ✓ | ✗ |
| Edit period metadata | ✓ | ✓ | ✗ |
| Create custom accounts | ✓ | ✗ | ✗ |
| Add/remove/move rows | ✓ | ✗ | ✗ |
| Create/delete entities | ✓ | ✗ | ✗ |
| Manage groups & combine | ✓ | ✗ | ✗ |

Implementation: every action handler checks user role before executing. UI disables or hides controls the user cannot use.

---

## 9. COMBINE TAB

**Simple additive combine** for the initial build:
- User selects which entities to include
- System sums matching `lineItemCode` values across selected entities for matching periods
- **Warnings displayed when:**
  - Period dates don't align across entities
  - Months-in-period differ (e.g., 12 months vs 9 months with same date)
  - An entity has no data for a period that others have
- Intercompany eliminations are **out of scope** for now (future feature)

---

## 10. COMMON SIZE

Inserted as a calculated `%` column after each period (toggle on/off).

| Statement | Default Denominator | User Override |
|-----------|-------------------|---------------|
| Balance Sheet | Total Assets | Not initially (can add later) |
| Income Statement | Total Revenue / Net Sales | Not initially (can add later) |
| Cash Flow | Beginning Cash OR (Begin Cash + EBITDA) | User selects which |

Common size is a **display-layer feature** — it doesn't change stored data, only rendering.

---

## 11. GRID SPECIFICATIONS

### Scale
- Maximum: 200 rows × 80 columns
- Typical: 100 rows × 40 columns
- Display window: 40-80 columns visible; database stores unlimited periods

### Technology
- CSS Grid layout (not HTML `<table>`)
- `<input type="text">` for each cell
- No third-party grid libraries
- React + TypeScript

### Keyboard Navigation
| Key | Behavior |
|-----|----------|
| Arrow keys | Move to adjacent editable cell |
| Enter | Move to next row, same column |
| Tab / Shift+Tab | Move to next/previous column |
| Escape | Revert cell, exit edit mode |
| F2 | Enter edit mode (cursor inside existing text) |
| Start typing | Replace cell contents (overwrite mode) |
| Backspace/Delete | Clear cell value |

### Number Formatting
| State | Display |
|-------|---------|
| Stored | Exact as entered (e.g., `1234567.89`) |
| On focus | Raw number for fast typing |
| On blur | Formatted with commas, parentheses for negatives |
| Display scaling | Units / Thousands / Millions (view only) |
| Rounding | Values rounded to cents (2 decimal places) at commit time |

### Row Types
| Row Type | Visual Treatment |
|----------|------------------|
| `data` | Normal editable row |
| `subtotal` | Bold, light background, border above |
| `total` | Bold, darker background, double border above |
| `sectionHeader` | Full-width label, no input cells |
| `spacer` | Empty row for visual separation |

### Context Menus (Right-Click)
- **Row context menu:** Insert above/below, move up/down, delete
- **Column context menu:** Insert blank/clone left/right, toggle active, clear values, delete
- **Cell context menu:** Font color (red/green/blue), background color (orange/yellow/pink), bold border, comments

---

## 12. FRONTEND APPLICATION STRUCTURE

```
<App>
  <MenuBar />                    ← File, Edit, View, Analysis, Export, Help
  <Toolbar />                    ← Display settings, period controls
  <EntityTabBar />               ← Tabs for each entity + Combined tab
  <StatementTabBar />            ← BS | IS | CF tabs within active entity
  <PeriodMetadataHeader />       ← Analyst, date, quality, months above grid
  <FinancialGrid />              ← The custom grid component
</App>
```

The grid component receives data for whichever entity + statement is currently active. Switching tabs just changes which data is passed down.

---

## 13. CURRENT BUILD STATUS (as of Feb 28, 2026)

### Completed:
- Full financial grid with CSS Grid layout, frozen headers
- Row numbers and column numbers
- Cell editing with keyboard navigation (arrows, Tab, Enter, F2, type-to-edit)
- Number formatting (commas, parentheses/minus, scale, rounding)
- Period variants (clone/blank columns with labels)
- Active/inactive toggle per period
- Cell highlighting (font color, background, bold border) via right-click
- Cell comments with red triangle indicator and hover tooltip
- Column context menu (insert, clone, toggle active, clear, delete)
- Row context menu (insert, move up/down, delete)
- Toolbar with period add/remove, date format, negative format, display scale
- Period visibility toggling
- Context menu component with separators and disabled items

### Not Yet Built:
- Menu bar (File, Edit, View, Analysis, Export, Help)
- Entity tabs and multi-entity state management
- Statement tabs (BS / IS / CF)
- Income statement row template
- Cash flow derivation engine and templates (Indirect, UCA, Custom, User-Created)
- Period metadata header (analyst, date, quality, months)
- Common size columns
- Combine tab with entity selection and warnings
- User permissions / role enforcement
- Formula engine for calculated rows (subtotals currently static)
- Undo/redo
- Company/entity header bar
- Row picker modal
- Backend (C# / ASP.NET Core)
- Database schema
- Export (Excel/PDF)

### Build Priority (Phases):
1. **Navigation shell** — Menu bar, entity tabs, statement tabs
2. **State architecture refactor** — Entity → Statements → Rows/Values
3. **Period metadata header** — The data fields above each period column
4. **Income statement** — Row template and layout
5. **Cash flow derivation** — Templates (Indirect, UCA, Custom) + formula engine
6. **Common size columns** — Display-layer calculated percentages
7. **Combine tab** — Simple additive with warnings
8. **User permissions** — Role-based gating of actions
9. **Undo/redo**

---

## 14. FILE STRUCTURE (Current)

```
Spread-Software2026/
└── spreadsheet/
    ├── package.json
    ├── tsconfig.json
    ├── public/
    └── src/
        ├── App.tsx                          ← Main app, all state handlers
        ├── App.css                          ← App layout and toolbar styles
        ├── index.tsx                        ← Entry point
        ├── components/
        │   ├── FinancialGrid.tsx            ← Main grid component
        │   ├── FinancialGrid.css            ← Grid styles
        │   ├── GridCell.tsx                 ← Individual cell component
        │   ├── ContextMenu.tsx              ← Right-click menu
        │   └── ContextMenu.css              ← Context menu styles
        ├── data/
        │   └── mockData.ts                  ← Sample BS rows + 3 annual periods
        ├── hooks/
        │   └── useGridNavigation.ts         ← Keyboard navigation hook
        ├── types/
        │   └── grid.types.ts                ← All TypeScript interfaces
        └── utils/
            └── formatNumber.ts              ← Number formatting utilities
```

---

## 15. DEVELOPMENT ENVIRONMENT

- **Editor:** Cursor (VS Code fork)
- **Project location:** `C:\Dev\Spread-Software2026`
- **GitHub:** `https://github.com/Solomon-Slate/Spread-Software2026` (public)
- **To clone:** `git clone https://github.com/Solomon-Slate/Spread-Software2026.git`
- **To run:** `cd spreadsheet && npm start`

---

## 16. DATABASE DESIGN NOTES (for future separate discussion)

The entity/group/portfolio relationship model is the most complex aspect of the schema. Key principles identified so far:

- Entity is the atomic unit with a system-generated unique ID
- Tax ID is the business key (for deduplication/matching)
- Groups are many-to-many with entities (join table)
- Portfolios are many-to-many with entities (join table), with two planned levels
- Financial values stored as append-only fact rows with versioning
- Registry definitions (line item codes) versioned with effectiveFrom/effectiveTo
- Spreads lock to a registryVersionId at creation

**This area needs a dedicated design session before implementation.**

---

## 17. GOVERNANCE GUARDRAILS

### Append-Only Financial Facts
- Never overwrite stored values
- Edits create new version row with audit trail
- Original entered values preserved; rounding at display/export only

### Registry Versioning
- Line item definitions versioned with effective dates
- Spreads lock to registry version at creation
- Explicit upgrade path when registry updates

### Namespace Enforcement
| Namespace | Owner | Mutability |
|-----------|-------|------------|
| `system.*` | Platform | Immutable |
| `tenant.*` | Bank admin | Admin-controlled |
| `user.*` | Individual user | Creator only |

---

*Architecture Document v4.0 — J-Spread*
