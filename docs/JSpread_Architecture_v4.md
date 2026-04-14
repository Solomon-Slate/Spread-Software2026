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


---

## 18. SESSION LOG — March 1, 2026

### What Was Completed:
- **Phase 2 (Navigation Shell): DONE.** AppHeader, EntityTabBar (with Combined tab), StatementTabBar (BS/IS clickable, CF greyed out) all implemented and working.
- **Income Statement mock data added.** Switching between BS and IS tabs swaps the grid data. Both are independently editable.
- **`.cursorrules` added to project root.** Defines commenting standards, architecture principles, and coding conventions for Cursor AI.
- **`spread.types.ts` created** (`spreadsheet/src/types/spread.types.ts`). This is the canonical data model and serves as the spec document for the state architecture. Heavily commented with banking domain context.

### Key Architecture Decisions Confirmed:
1. **Highlights and comments are cell-level attributes** — they live inside StatementData at the row × period intersection. They do NOT carry across statements, entities, or to the combined view.
2. **Periods are per-entity.** Different entities can have different fiscal years and different reporting frequencies.
3. **Display settings are global** (negative format, scale, date format apply to whole workspace).
4. **Row templates are per-entity per-statement.** Standard templates provide a starting point but entities can diverge completely. Different industries have very different account structures.
5. **Cash flow is derived per-entity** from that entity's own BS and IS. Combined cash flow is derived from the combined BS and IS — NOT by summing individual entity cash flows.
6. **The grid is an I/O interface, not the data model.** Position within sections determines classification (affects subtotals and tags), but the underlying data is tagged values queried by lineItemCode.
7. **Row reclassification (moving between sections) changes the classification tag** — this is a substantive analytical decision with validation rules. A reclassification rules document is pending (does not block current development).
8. **Combined view** matches by lineItemCode across selected entities. Sums what matches, carries over what doesn't. Warns on period mismatches.

### Items Identified But Not Yet Built:
- `fiscalYearEndMonth` field on EntityMetadata — needed so the system can auto-calculate monthsInPeriod and identify which statement is the full fiscal year
- Additional UserRole levels beyond admin/analyst/viewer (structure supports it, just not enumerated yet)
- Additional entity/period metadata fields (documented separately, just more fields on existing interfaces)
- Reclassification rules document — Jay to write, covering permitted section moves and exceptions (e.g., intangible assets can become negative equity)

### Next Steps (Phase 1 Completion):
1. **Refactor App.tsx** to use the `spread.types.ts` data model — replace flat state with Entity → Statement → Values hierarchy
2. **Create mock data** that populates the new Entity/Group structures
3. **Wire entity tab switching** so clicking a different entity tab loads that entity's data into the grid
4. **Add `fiscalYearEndMonth`** to EntityMetadata

### Development Workflow Established:
- **Claude (claude.ai):** Architecture, planning, type definitions, Cursor-ready code instructions
- **Cursor (Pro, Sonnet engine):** Applies code changes to the actual codebase
- **Git branch:** All work on `feature/architecture-expansion`, `main` preserved as stable baseline
- **Commenting standard:** Enforced via `.cursorrules` — file headers, interface docs, business logic explanations

---

## 19. SESSION LOG — March 3, 2026

### What Was Completed:
- **State Architecture Refactor: DONE.** App.tsx now uses Entity → Statement → Values hierarchy from `spread.types.ts`. All ~15 flat `useState` calls replaced with structured state: `entities` Map, `displaySettings`, navigation state.
- **Two mock entities created** in `mockSpreadData.ts`:
  - **Acme Manufacturing, Inc.** — manufacturing IS pattern (NetSales, COGS, Salaries, Rent, Utilities)
  - **ABC Inc.** — real estate IS pattern (RentalIncome, PropertyMgmtFees, PropertyTaxes, Insurance, Maintenance)
- **Entity tab switching fully functional.** Clicking between entities loads different data, different IS row templates, independent edits per entity per statement.
- **All handlers rewired** via `updateStatementData` and `updateActivePeriods` helpers. Values, highlights, comments, periods, and rows all scoped to correct entity + statement.
- **Period clone fix:** Cloning a period column now copies values across BS and IS (not CF, since CF is derived). Previously only cloned the active statement.
- **Old `mockData.ts` retained** but no longer imported by App.tsx.

### Key Findings During Implementation:
1. **Different IS templates across entities work naturally.** The grid just renders whatever rows the active entity's statement has. No special handling needed.
2. **Combined view implications confirmed:** Matching lineItemCodes (e.g., `IS.Other.InterestExp` exists on both entities) will sum. Non-matching codes (NetSales vs RentalIncome) carry over independently. This falls out of the tag-driven design.
3. **Period clone is an entity-level operation**, not statement-level. The period belongs to the entity and appears on all statements, so cloning must copy values across all input statements (BS + IS). CF is excluded because its values are derived, not entered.

---

## 20. REVISED BUILD PRIORITY (as of March 3, 2026)

Phases 1-2 are complete. Revised priority with new items integrated:

### Phase 3: Grid Editing Enhancements
Priority: HIGH — these are daily-use quality-of-life features that affect every editing session.

**3a. In-cell editing (F2 / double-click to edit existing value)**
- Currently typing into a cell replaces the entire value. Users need to be able to position cursor within the existing number to make small corrections (e.g., change 618000 to 619000 without retyping).
- F2 key should enter edit mode with the existing value selected. Typing replaces; arrow keys within the cell move the cursor.
- This may already partially work via the existing `useGridNavigation` hook — needs evaluation.

**3b. Copy/paste single cell value**
- Ctrl+C copies the focused cell's value, Ctrl+V pastes into the focused cell.
- Single cell only for now. Range copy/paste is a future enhancement.
- Must work across entities and statements (copy from Acme BS, paste into ABC BS).

**3c. Clear entire row of values**
- Right-click row → "Clear Row Values" — clears all period values for that row on the current statement, but does NOT delete the row itself.
- Requires confirmation prompt ("Clear all values for [row label]?").
- Leaves the row definition, highlights, and comments intact. Only zeroes out the values Map entries for that lineItemCode.

**3d. Clear all formatting on current statement**
- Menu or toolbar action: "Clear All Formatting" — removes all highlights (font color, background, bold border) from the currently displayed statement on the current entity.
- Does NOT clear comments (comments are analytical notes, not formatting).
- Scope: one entity + one statement. E.g., "Clear formatting on ABC Inc. Balance Sheet" leaves ABC IS and Acme BS untouched.

### Phase 4: Row Reclassification Guardrails
Priority: HIGH — substantive analytical correctness. Without this, users can create invalid classifications.

**4a. Permitted section rules**
- When a user moves a row (drag or right-click → Move) between sections, the system must validate the move against `RowDefinition.permittedSections`.
- Example: `Asset.Current.AR` has `permittedSections: ['Asset.Current', 'Asset.Term']`. User can move it from Current Assets to Term Assets (reclassify as long-term A/R). User CANNOT move it to Liabilities or Equity — system blocks with explanation.

**4b. Tag update on reclassification**
- When a permitted move happens, the row's `lineItemCode` prefix updates to reflect the new section. E.g., moving A/R from Current to Term changes `Asset.Current.AR` → `Asset.Term.AR`.
- The subtotal the row rolls into changes accordingly.
- This is a substantive analytical decision — should be logged/auditable.

**4c. Reclassification rules document**
- Jay to write: a reference document defining permitted section moves and exceptions for standard accounts.
- Known exception: intangible assets can become negative equity (goodwill impairment).
- This document feeds into `permittedSections` arrays on row definitions.

### Phase 5: Period Metadata Header
Priority: MEDIUM — important for data quality assessment but not blocking other work.

- Render the `PeriodMetadata` fields above each period column: analyst name, statement date, statement quality, months in period, notes.
- Editable fields (click to edit inline or via small popover).
- `fiscalYearEndMonth` added to `EntityMetadata` — system uses this to auto-calculate `monthsInPeriod` for new periods and identify the full fiscal year.
- Statement quality displays as a badge or color-coded indicator (audited = green, interim = yellow, proForma = orange, etc.).

### Phase 6: Subtotal / Formula Engine
Priority: MEDIUM — currently subtotals are static mock values.

- Computed rows (subtotal, total) derive their values from the data rows in their section.
- Engine walks the row array: when it hits a subtotal, it sums all preceding data rows since the last section header or subtotal. When it hits a total, it sums all subtotals in its scope.
- Runs on every value change (debounced). Results written into the values Map as computed entries (possibly flagged so they're not confused with user-entered values).
- Must handle the different IS structures: Gross Profit = NetSales - COGS on Acme, Gross Revenue = RentalIncome + PropertyMgmtFees on ABC.

### Phase 7: Cash Flow Derivation
Priority: MEDIUM — core analytical feature, but requires Phase 6 first.

- Four template types: Indirect, UCA, Custom (Jay's proprietary), User-Created.
- All derive from BS deltas and IS values. E.g., `delta(Asset.Current.AR)` = prior period AR minus current period AR.
- CF is per-entity, computed from that entity's own BS and IS.
- CF rows are not editable (derived), but user can reorder, consolidate/unconsolidate.

### Phase 8: Common Size Columns
Priority: MEDIUM — display-layer calculated percentages.

- BS: each value as % of Total Assets.
- IS: each value as % of Total Revenue / Net Sales (or Gross Revenue for real estate entities).
- Toggle on/off per statement. Display-only columns interleaved with or appended after value columns.

### Phase 9: Entity Management
Priority: MEDIUM-HIGH — needed before Combine Tab is useful.

**9a. Add Entity to workspace**
- "+" button on entity tab bar opens a modal with two paths:
  - **Create New:** Select a row template (standard BS, standard manufacturing IS, standard real estate IS, blank). Creates a new entity with system-generated ID. User enters name, tax ID, industry.
  - **Load Existing:** Search by borrower name or tax ID. Pulls entity from database into the current workspace. Entity retains all its existing data, periods, statements.
- Default workspace starts with one entity. Adding a second automatically makes the Combined tab available.

**9b. Group management**
- A group is created implicitly when 2+ entities are in a workspace, or explicitly via "Save As Group" action.
- Group metadata (name, relationship manager) editable from a small dialog accessible from the header area.
- Each entity saves independently (atomic unit). The group saves as a lightweight record: group name, RM, ordered list of entity IDs, combine config.

**9c. Remove entity from group**
- Right-click entity tab → "Remove from Group."
- Detaches the reference only — does NOT delete the entity from the database. The entity remains available for other groups.
- Removing down to one entity hides the Combined tab.
- Confirmation prompt: "Remove [entity name] from this group? The entity will still exist in the database."

### Phase 10: Combine Tab
Priority: MEDIUM — depends on Phase 9.

**10a. Automatic combined view**
- Combined tab appears automatically when 2+ entities are in the workspace. Disappears when reduced to 1.
- Combined view is computed on the fly, not stored. It's a view, not an entity.

**10b. Entity selection for combining**
- Small panel at the top of the Combined tab showing each entity with a checkbox. All checked by default.
- Uncheck an entity → combined values recompute without it.
- This is `combineConfig.includedEntityIds` already in the type system.

**10c. Combining logic**
- Match by `lineItemCode` across selected entities.
- Matching codes: sum the values.
- Non-matching codes: carry over as independent rows.
- Combined BS and IS are simple sums. Combined CF is derived from the combined BS and IS — NOT by summing individual entity CFs.
- Warnings generated for: period date mismatches, months-in-period mismatches, missing data on one entity.

**10d. Combined view is read-only**
- Users cannot edit values in the combined view. They edit on individual entity tabs.
- Highlights and comments do not carry into the combined view.

### Phase 11: Row Picker / Period Picker (Menu Bar)
Priority: LOW-MEDIUM — improves workflow but not blocking.

- Row Picker modal: when inserting a new row, instead of just prompting for a name, show a searchable list of standard accounts from the registry. User picks from the list or types a custom name. Selected account comes with pre-populated lineItemCode, permittedSections, and indentation.
- Period Picker: menu bar action to insert a period at a specific position (not just append to end). Select a date, optionally clone from existing, choose insertion point.

### Phase 12: Menu Bar
Priority: LOW-MEDIUM — organizational, can be built incrementally.

- File: New, Open, Save, Save As, Export (Excel/PDF)
- Edit: Undo, Redo, Copy, Paste, Clear Formatting, Clear Row Values
- View: Toggle period visibility, common size on/off, display settings
- Analysis: Ratios (future), Trend Analysis (future)
- Help: About, keyboard shortcuts reference

### Phase 13: Undo/Redo
Priority: LOW — valuable but complex. Can be deferred.

- Command pattern: each action (cell edit, row move, period add, reclassification) creates a reversible command object.
- Undo stack and redo stack. Ctrl+Z / Ctrl+Y.
- Scope: per entity per statement, or global? TBD — per entity per statement is simpler but global is more intuitive.

### Phase 14: User Permissions
Priority: LOW — needed for production, not for development.

### Phase 15: Backend (C# / ASP.NET Core) + Database
Priority: DEFERRED — all current work is frontend with mock data. Backend design session needed separately (database consultant).

---

## 21. KNOWN GAPS & FUTURE CONSIDERATIONS

- **Personal financial statements** will have yet another chart of accounts pattern (assets: residence, vehicles, retirement accounts; liabilities: mortgage, student loans, credit cards; no revenue/COGS). This further validates the tag-driven approach — the system doesn't care what the accounts are, it just needs lineItemCodes and permittedSections.
- **Range copy/paste** (selecting a block of cells and copying) — future enhancement beyond single-cell copy/paste.
- **Row templates as importable/exportable presets** — banks may want standardized templates that all analysts use. Template management UI is a future feature.
- **Audit trail** — every value change should eventually be logged with timestamp, user, old value, new value. The append-only architecture supports this but the UI for viewing history is not yet designed.
---

## 22. PERSONAL & GLOBAL CASH FLOW ARCHITECTURE

### Overview
The personal financial statement is spread directly from source documents (1040, K-1s, personal financial statements) by the analyst. It is not auto-populated from entity spreads. The system provides a structured starting point via ID-tag-driven links, which the analyst confirms or overrides.

### Three-Tier System-Assisted Assembly

**Tier 1 — Entity to Personal:**
Certain entity-level accounts carry tags linking them to a personal entity ID (owner ID). These accounts include but are not limited to:
- Distributions / Dividends (per owner)
- Management fees paid to individuals
- Guaranteed payments (partnerships)
- Intercompany loans to/from owners
- Officer compensation

At the entity level, these accounts are set up per owner (e.g., Distributions — Owner A, Distributions — Owner B), each tagged to the respective personal entity ID. For display purposes these collapse to a summary subtotal on the entity spread to avoid clutter. The granularity is present in the data but condensed in the view.

Tagged values surface on the personal spread as system-suggested starting points only. The personal spread remains analyst-driven from source documents — the entity tag provides a reference and a cross-check, not an authoritative population.

**Tier 2 — Personal and Entity to Global:**
The system assembles a draft global cash flow worksheet by combining entity-level CAFDS (Cash Available for Debt Service) and personal cash flow. Owner ID tags are used to identify intercompany flows that appear on both sides and flag them for elimination rather than double-counting. The assembled global is presented as an analyst starting point, not a final output.

**Tier 3 — Analyst Override at All Levels:**
At every tier the analyst retains full control. The system-suggested values are a starting point only.

### Link Management — Deliberate Override Pattern
The link between an entity account and its corresponding personal or global line is **live by default**. Behavior:
- If the underlying entity spread is updated, the linked personal/global value updates automatically.
- Breaking a link is a **deliberate analyst action** — not triggered by simply typing over a value.
- Breaking a link requires: (1) explicit disconnect action, (2) a reason/note, (3) an override value entered by the analyst.
- The original system-derived value is always retained and visible alongside the override for audit and review purposes.
- Link status is tracked per line as: `active` | `broken` | `never-linked`.

### Double-Counting Elimination
Double-counting elimination at the global level is **analyst-driven, not system-automated.** The system supports the analyst by:
- Surfacing source entity tags on personal lines, making intercompany flows visible.
- Flagging lines where the same dollars appear on both an entity spread and a personal spread via shared ID tags.
- Providing note fields at the global line level for the analyst to document elimination decisions.

This approach is intentional — automated elimination would require ownership percentage logic that does not reflect actual cash distributions in practice. The analyst who knows the file makes the elimination judgment; the system makes that judgment transparent and auditable.

### Analyst Notes and Period-Over-Period Consistency
Note fields at the cell/line level serve as the audit trail for grouping decisions, elimination rationale, and sourcing. These notes carry forward when a new period is opened for the same entity/group, giving subsequent analysts visibility into how prior periods were handled and enabling consistent methodology across the relationship over time.

### Schema Implications
- Entity accounts that can flow to personal carry a `personal_entity_id` tag field (nullable — only populated when the account is owner-specific).
- A `personal_link` table tracks: source entity account, target personal line, link status, override value, override reason, override timestamp, analyst ID.
- Global cash flow assembly logic references these link records to identify elimination candidates.
- Personal and global spread tables are additive to the schema — they do not modify the core entity spread value architecture.

---

## 23. PROJECTIONS & MONTE CARLO — PLANNED ARCHITECTURE

### Overview
Each spread line item will carry an optional forward projection profile. The projection layer is a separate analytical module that reads historical spread data but does not modify it. This is a later-roadmap feature — the schema foundation accommodates it without changes to core tables.

### Parameter Structure (Per Line Item)
Each line item's projection profile includes:
- **Distribution type** — user-defined, not assumed normal. Options include normal, log-normal, skewed, uniform, user-defined PDF.
- **Slope / trend** — forward directional assumption (flat, growth rate, regression-derived).
- **Noise factor** — variance around the trend.
- **Correlation relationships** — links to other accounts (e.g., COGS correlated to Revenue, Receivables correlated to Revenue). Reflects real business behavior where accounts move together, not independently.

### Data-Driven Parameter Discovery
Where sufficient historical periods exist (ideally 5+ years), the spread data itself informs suggested starting parameters:
- The system can suggest correlation coefficients between accounts based on observed historical behavior.
- High-variance lines are flagged as such.
- The analyst reviews and adjusts forward-looking assumptions from this informed baseline rather than starting cold.
- Historical spread data does double duty: credit history and projection calibration input.

### Projection Setup UI
A dedicated projection setup interface (separate from the spread entry UI) allows analysts to:
- Review system-suggested parameters.
- Customize distribution type, slope, noise, and inter-account correlations per line.
- Define forward period assumptions.
This is a form-heavy but well-structured interface — a parameter configuration layer sitting above the spread data.

### Monte Carlo Output
Thousands of iterations are run against the projection profiles to produce distributions of key credit metrics rather than single point estimates. Outputs include:
- Visual distributions of DSCR, leverage ratios, liquidity metrics across simulated periods.
- Threshold probabilities (e.g., probability DSCR falls below 1.0x in Year 2).
- A proprietary liquidity-based default probability metric (design TBD — specific to cash flow behavior captured through the spreading architecture).

### Schema Implications (Additive — No Core Table Changes)
- `projection_parameters` table — per entity, per account: distribution type, slope, noise, correlation links.
- `projection_runs` table — Monte Carlo run metadata (timestamp, analyst, parameter snapshot).
- `projection_results` table — output distributions, percentiles, threshold probabilities per run.
- The inter-account correlation structure uses a self-referencing relationship on the accounts/tags table — worth designing deliberately when this phase is reached.
---

*Architecture Document v4.0 + Session Updates (March 1, March 3 & April 14, 2026) — J-Spread*