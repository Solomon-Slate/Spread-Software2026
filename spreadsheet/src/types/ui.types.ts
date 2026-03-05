/**
 * ui.types.ts — UI-Layer Types for J-Spread
 * 
 * Types governing the user interface state: navigation, layout, display modes.
 * These are separate from the data model (spread.types.ts) because they describe
 * what the user is LOOKING AT, not what data EXISTS.
 * 
 * The three non-statement tabs (Analysis, Charts, Graphs) are output destinations —
 * they display calculated results derived from statement data, but do not store
 * or define financial data themselves.
 */

import { StatementType } from './spread.types';

/**
 * All navigable tabs in the statement/view tab bar.
 * BS, IS, CF are data-entry statement grids.
 * Analysis, Charts, Graphs are output views for calculated results.
 */
export type ViewTab = StatementType | 'Analysis' | 'Charts' | 'Graphs';