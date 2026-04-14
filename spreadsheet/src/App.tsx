import React, { useState, useCallback, useMemo } from 'react';
import AppHeader from './components/AppHeader';
import EntityTabBar from './components/EntityTabBar';
import StatementTabBar from './components/StatementTabBar';
import { FinancialGrid } from './components/FinancialGrid';
import {
  Entity,
  StatementType,
  StatementData,
  DisplaySettings,
  UserSession,
  Group,
  CellChange,
  CellHighlight,
  PeriodDefinition,
  RowDefinition,
  NegativeDisplayFormat,
  DisplayScale,
  DateDisplayFormat,
  makeValueKey,
} from './types/spread.types';
import type { ViewTab } from './types/ui.types';

import {
  mockEntities,
  mockGroup,
  mockDisplaySettings,
  mockCurrentUser,
} from './data/mockSpreadData';
import './App.css';

function App() {
  // === Core data state ===
  const [entities, setEntities] = useState<Map<string, Entity>>(() => new Map(mockEntities));
  const [activeGroup] = useState<Group>(mockGroup);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(mockDisplaySettings);
  const [currentUser] = useState<UserSession>(mockCurrentUser);

  // === Navigation state ===
  const [activeEntityId, setActiveEntityId] = useState<string>('entity_acme');
  const [activeStatement, setActiveStatement] = useState<ViewTab>('BS');
  const [isCombinedActive, setIsCombinedActive] = useState(false);

  // When the selected tab is a statement (BS/IS/CF), use it for data; otherwise use BS for grid data
  const activeStatementType: StatementType =
    activeStatement === 'BS' || activeStatement === 'IS' || activeStatement === 'CF'
      ? activeStatement
      : 'BS';

  // === UI-only state ===
  const [hiddenPeriods, setHiddenPeriods] = useState<Set<string>>(new Set());
  const [nextCustomId, setNextCustomId] = useState(1);
  const [nextVariantId, setNextVariantId] = useState(1);

  // === Derived from state ===
  const activeEntity = entities.get(activeEntityId)!;
  const activeStatementData = activeEntity.statements[activeStatementType];
  const activePeriods = activeEntity.periods;
  const activeRows = activeStatementData.rows;
  const activeValues = activeStatementData.values;
  const activeHighlights = activeStatementData.highlights;
  const activeComments = activeStatementData.comments;
  const companyName = activeEntity.metadata.borrowerName;

  const entitiesListForTabs = useMemo(
    () =>
      activeGroup.entityIds.map(entityId => ({
        entityId,
        name: entities.get(entityId)?.metadata.borrowerName ?? entityId,
      })),
    [activeGroup, entities]
  );

  const visiblePeriods = useMemo(() => {
    return activePeriods.filter(p => !hiddenPeriods.has(p.periodId));
  }, [activePeriods, hiddenPeriods]);

  /** Helper: update a specific statement's data within the entities Map */
  const updateStatementData = useCallback((
    entityId: string,
    stmtType: StatementType,
    updater: (stmt: StatementData) => StatementData
  ) => {
    setEntities(prev => {
      const next = new Map(prev);
      const entity = next.get(entityId);
      if (!entity) return prev;
      const updatedEntity: Entity = {
        ...entity,
        statements: {
          ...entity.statements,
          [stmtType]: updater({ ...entity.statements[stmtType] }),
        },
      };
      next.set(entityId, updatedEntity);
      return next;
    });
  }, []);

  /** Helper: update the active entity's periods array */
  const updateActivePeriods = useCallback((
    updater: (periods: PeriodDefinition[]) => PeriodDefinition[]
  ) => {
    setEntities(prev => {
      const next = new Map(prev);
      const entity = next.get(activeEntityId);
      if (!entity) return prev;
      next.set(activeEntityId, {
        ...entity,
        periods: updater([...entity.periods]),
      });
      return next;
    });
  }, [activeEntityId]);

  const handleChange = useCallback((changes: CellChange[]) => {
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      const newValues = new Map(stmt.values);
      for (const change of changes) {
        const key = makeValueKey(change.lineItemCode, change.periodId);
        if (change.newValue === null) {
          newValues.delete(key);
        } else {
          newValues.set(key, change.newValue);
        }
      }
      return { ...stmt, values: newValues };
    });
  }, [activeEntityId, activeStatementType, updateStatementData]);
  const handleHighlightChange = useCallback((key: string, highlight: CellHighlight | null) => {
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      const newHighlights = new Map(stmt.highlights);
      if (highlight === null) {
        newHighlights.delete(key);
      } else {
        newHighlights.set(key, highlight);
      }
      return { ...stmt, highlights: newHighlights };
    });
  }, [activeEntityId, activeStatementType, updateStatementData]);
  const handleCommentChange = useCallback((key: string, comment: string | null) => {
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      const newComments = new Map(stmt.comments);
      if (comment === null) {
        newComments.delete(key);
      } else {
        newComments.set(key, comment);
      }
      return { ...stmt, comments: newComments };
    });
  }, [activeEntityId, activeStatementType, updateStatementData]);
  const addPeriod = useCallback(() => {
    updateActivePeriods((periods) => {
      const lastPeriod = periods[periods.length - 1];
      const lastDate = new Date(lastPeriod.periodEnd);
      const newYear = lastDate.getFullYear() + 1;
      const newDateStr = `${newYear}-12-31`;
      const newPeriod: PeriodDefinition = {
        periodId: `${newDateStr}_v1`,
        periodEnd: newDateStr,
        periodType: 'Y',
        isActive: true,
        isIncluded: true,
        metadata: {
          analystName: currentUser.userName,
          statementDate: newDateStr,
          statementQuality: 'companyPrepared',
          monthsInPeriod: 12,
          notes: '',
        },
      };
      return [...periods, newPeriod];
    });
  }, [updateActivePeriods, currentUser.userName]);
  const removePeriod = useCallback(() => {
    updateActivePeriods((periods) => {
      if (periods.length <= 1) return periods;
      return periods.slice(0, -1);
    });
  }, [updateActivePeriods]);
  const handleDeletePeriod = useCallback((periodId: string) => {
    setEntities(prev => {
      const next = new Map(prev);
      const entity = next.get(activeEntityId);
      if (!entity) return prev;
      if (entity.periods.length <= 1) return prev;
      const newPeriods = entity.periods.filter(p => p.periodId !== periodId);
      const newStatements = { ...entity.statements };
      for (const stmtType of ['BS', 'IS', 'CF'] as StatementType[]) {
        const stmt = newStatements[stmtType];
        const newValues = new Map(stmt.values);
        for (const key of Array.from(newValues.keys())) {
          if (key.endsWith(`|${periodId}`)) {
            newValues.delete(key);
          }
        }
        newStatements[stmtType] = { ...stmt, values: newValues };
      }
      next.set(activeEntityId, { ...entity, periods: newPeriods, statements: newStatements });
      return next;
    });
  }, [activeEntityId]);
  const handleClearPeriod = useCallback((periodId: string) => {
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      const newValues = new Map(stmt.values);
      for (const key of Array.from(newValues.keys())) {
        if (key.endsWith(`|${periodId}`)) {
          newValues.delete(key);
        }
      }
      return { ...stmt, values: newValues };
    });
  }, [activeEntityId, activeStatementType, updateStatementData]);
  const handleInsertColumn = useCallback((atColIndex: number, position: 'left' | 'right', mode: 'clone' | 'blank') => {
    const entity = entities.get(activeEntityId);
    if (!entity) return;
    const sourcePeriod = entity.periods[atColIndex];
    const variantLabel = window.prompt(
      'Enter a label for this version (e.g., "CPA Reviewed", "Pro Forma", "What-If"):',
      mode === 'clone' ? 'Copy' : 'New'
    );
    if (!variantLabel || variantLabel.trim() === '') return;
    const newPeriodId = `${sourcePeriod.periodEnd}_var${nextVariantId}`;
    setNextVariantId(prev => prev + 1);
    const newPeriod: PeriodDefinition = {
      periodId: newPeriodId,
      periodEnd: sourcePeriod.periodEnd,
      periodType: sourcePeriod.periodType,
      variant: variantLabel.trim(),
      isActive: false,
      isIncluded: true,
      metadata: {
        ...sourcePeriod.metadata,
        analystName: currentUser.userName,
        notes: '',
      },
    };
    setEntities(prev => {
      const next = new Map(prev);
      const ent = next.get(activeEntityId);
      if (!ent) return prev;
      const newPeriods = [...ent.periods];
      const insertAt = position === 'left' ? atColIndex : atColIndex + 1;
      newPeriods.splice(insertAt, 0, newPeriod);
      let newStatements = { ...ent.statements };
      if (mode === 'clone') {
        for (const stmtType of ['BS', 'IS'] as StatementType[]) {
          const stmt = ent.statements[stmtType];
          const newValues = new Map(stmt.values);
          stmt.rows.forEach(row => {
            const sourceKey = makeValueKey(row.lineItemCode, sourcePeriod.periodId);
            const sourceVal = stmt.values.get(sourceKey);
            if (sourceVal !== undefined) {
              newValues.set(makeValueKey(row.lineItemCode, newPeriodId), sourceVal);
            }
          });
          newStatements[stmtType] = { ...stmt, values: newValues };
        }
      }
      next.set(activeEntityId, { ...ent, periods: newPeriods, statements: newStatements });
      return next;
    });
  }, [activeEntityId, entities, nextVariantId, currentUser.userName]);
  const handleToggleActive = useCallback((periodId: string) => {
    updateActivePeriods((periods) => {
      const targetPeriod = periods.find(p => p.periodId === periodId);
      if (!targetPeriod) return periods;
      const siblings = periods.filter(p => p.periodEnd === targetPeriod.periodEnd);
      if (targetPeriod.isActive && siblings.length === 1) {
        window.alert('Cannot deactivate the only version of this period.');
        return periods;
      }
      return periods.map(p => {
        if (p.periodEnd === targetPeriod.periodEnd) {
          if (!targetPeriod.isActive) {
            return { ...p, isActive: p.periodId === periodId };
          }
          if (p.periodId === periodId) {
            return { ...p, isActive: false };
          }
        }
        return p;
      });
    });
  }, [updateActivePeriods]);
  const handleInsertRow = useCallback((atIndex: number, position: 'above' | 'below') => {
    const label = window.prompt('Enter account name:');
    if (!label || label.trim() === '') return;
    const newRow: RowDefinition = {
      lineItemCode: `Custom.UserDefined.${nextCustomId}`,
      label: label.trim(),
      rowType: 'data',
      indentLevel: 1,
      isEditable: true,
    };
    setNextCustomId(prev => prev + 1);
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      const newRows = [...stmt.rows];
      const insertAt = position === 'above' ? atIndex : atIndex + 1;
      newRows.splice(insertAt, 0, newRow);
      return { ...stmt, rows: newRows };
    });
  }, [activeEntityId, activeStatementType, nextCustomId, updateStatementData]);
  const handleDeleteRow = useCallback((atIndex: number) => {
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      const row = stmt.rows[atIndex];
      const newValues = new Map(stmt.values);
      for (const key of Array.from(newValues.keys())) {
        if (key.startsWith(`${row.lineItemCode}|`)) {
          newValues.delete(key);
        }
      }
      const newRows = [...stmt.rows];
      newRows.splice(atIndex, 1);
      return { ...stmt, rows: newRows, values: newValues };
    });
  }, [activeEntityId, activeStatementType, updateStatementData]);
  const handleMoveRow = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= stmt.rows.length) return stmt;
      const newRows = [...stmt.rows];
      const temp = newRows[fromIndex];
      newRows[fromIndex] = newRows[toIndex];
      newRows[toIndex] = temp;
      return { ...stmt, rows: newRows };
    });
  }, [activeEntityId, activeStatementType, updateStatementData]);

  const handleClearRow = useCallback((rowIndex: number) => {
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      const row = stmt.rows[rowIndex];
      if (!row) return stmt;
      const lineItemCode = row.lineItemCode;
      const newValues = new Map(stmt.values);
      for (const key of Array.from(newValues.keys())) {
        if (key.startsWith(`${lineItemCode}|`)) {
          newValues.delete(key);
        }
      }
      return { ...stmt, values: newValues };
    });
  }, [activeEntityId, activeStatementType, updateStatementData]);

  const handleClearFormatting = useCallback(() => {
    if (!window.confirm('Clear all formatting on this statement?')) return;
    updateStatementData(activeEntityId, activeStatementType, (stmt) => {
      return { ...stmt, highlights: new Map() };
    });
  }, [activeEntityId, activeStatementType, updateStatementData]);

  return (
    <div className="app">
      <AppHeader />
      <EntityTabBar
        entities={entitiesListForTabs}
        activeEntityId={activeEntityId}
        showCombined={entitiesListForTabs.length > 1}
        isCombinedActive={isCombinedActive}
        onSelectEntity={(id) => { setActiveEntityId(id); setIsCombinedActive(false); }}
        onSelectCombined={() => setIsCombinedActive(true)}
      />
      <StatementTabBar
        activeStatement={activeStatement}
        onSelectStatement={setActiveStatement}
        cashFlowAvailable={false}
      />

      <div className="toolbar">
        <div className="toolbar-section">
          <label>Periods:</label>
          <div className="period-controls">
            <button 
              className="period-btn remove" 
              onClick={removePeriod}
              disabled={activePeriods.length <= 1}
              title="Remove last period"
            >
              −
            </button>
            <span className="period-count">{activePeriods.length} periods</span>
            <button 
              className="period-btn add" 
              onClick={addPeriod}
              title="Add new period"
            >
              +
            </button>
          </div>
          <div className="period-list">
            {activePeriods.map(p => (
              <span 
                key={p.periodId} 
                className={`period-tag ${hiddenPeriods.has(p.periodId) ? 'hidden' : ''}`}
                onClick={() => {
                  setHiddenPeriods(prev => {
                    const next = new Set(prev);
                    if (next.has(p.periodId)) {
                      next.delete(p.periodId);
                    } else {
                      next.add(p.periodId);
                    }
                    return next;
                  });
                }}
                title={hiddenPeriods.has(p.periodId) ? 'Click to show' : 'Click to hide'}
              >
                {p.periodEnd}{p.variant ? ` (${p.variant})` : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <label>Date Format:</label>
          <select
            value={displaySettings.dateFormat}
            onChange={e => setDisplaySettings(prev => ({ ...prev, dateFormat: e.target.value as DateDisplayFormat }))}
          >
            <option value="MM/DD/YYYY">12/31/2022</option>
            <option value="MM/DD/YY">12/31/22</option>
            <option value="MM/YY">12/22</option>
          </select>
        </div>

        <div className="toolbar-section">
          <label>Negatives:</label>
          <select
            value={displaySettings.negativeFormat}
            onChange={e => setDisplaySettings(prev => ({ ...prev, negativeFormat: e.target.value as NegativeDisplayFormat }))}
          >
            <option value="parentheses">(1,093)</option>
            <option value="minus">-1,093</option>
          </select>
        </div>

        <div className="toolbar-section">
          <label>Scale:</label>
          <select
            value={displaySettings.displayScale}
            onChange={e => setDisplaySettings(prev => ({ ...prev, displayScale: e.target.value as DisplayScale }))}
          >
            <option value="decimal">Decimal</option>
            <option value="units">Units</option>
            <option value="thousands">Thousands</option>
            <option value="millions">Millions</option>
          </select>
        </div>
      </div>

      <main className="grid-container">
        <FinancialGrid
          rows={activeRows}
          periods={visiblePeriods}
          values={activeValues}
          highlights={activeHighlights}
          companyName={companyName}
          onChange={handleChange}
          onHighlightChange={handleHighlightChange}
          comments={activeComments}
          onCommentChange={handleCommentChange}
          onDeletePeriod={handleDeletePeriod}
          onClearPeriod={handleClearPeriod}
          onInsertColumn={handleInsertColumn}
          onToggleActive={handleToggleActive}
          onInsertRow={handleInsertRow}
          onDeleteRow={handleDeleteRow}
          onClearRow={handleClearRow}
          onMoveRow={handleMoveRow}
          onClearFormatting={handleClearFormatting}
          negativeFormat={displaySettings.negativeFormat}
          displayScale={displaySettings.displayScale}
          dateFormat={displaySettings.dateFormat}
          decimalPlaces={displaySettings.displayScale === 'decimal' ? 2 : 0}
        />
      </main>
    </div>
  );
}

export default App;