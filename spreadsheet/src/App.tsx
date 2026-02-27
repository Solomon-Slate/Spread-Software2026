import React, { useState, useCallback, useMemo } from 'react';
import { FinancialGrid } from './components/FinancialGrid';
import { mockRows, allPeriods, createMockValues } from './data/mockData';
import { NegativeDisplayFormat, DisplayScale, DateDisplayFormat, CellChange, PeriodDefinition, RowDefinition, makeValueKey } from './types/grid.types';
import './App.css';

function App() {
  const [values, setValues] = useState(() => createMockValues());
  const [negativeFormat, setNegativeFormat] = useState<NegativeDisplayFormat>('parentheses');
  const [displayScale, setDisplayScale] = useState<DisplayScale>('units');
  const [dateFormat, setDateFormat] = useState<DateDisplayFormat>('MM/DD/YYYY');
  const [periods, setPeriods] = useState<PeriodDefinition[]>(allPeriods);
  const [rows, setRows] = useState<RowDefinition[]>([...mockRows]);
  const [hiddenPeriods, setHiddenPeriods] = useState<Set<string>>(new Set());
  const [nextCustomId, setNextCustomId] = useState(1);
  const [nextVariantId, setNextVariantId] = useState(1);
  const [companyName] = useState('Acme Manufacturing, Inc.');

  const visiblePeriods = useMemo(() => {
    return periods.filter(p => !hiddenPeriods.has(p.periodId));
  }, [periods, hiddenPeriods]);

  const handleChange = useCallback((changes: CellChange[]) => {
    setValues(prev => {
      const newValues = new Map(prev);
      for (const change of changes) {
        const key = `${change.lineItemCode}|${change.periodId}`;
        if (change.newValue === null) {
          newValues.delete(key);
        } else {
          newValues.set(key, change.newValue);
        }
      }
      return newValues;
    });
  }, []);

  const addPeriod = useCallback(() => {
    setPeriods(prev => {
      const lastPeriod = prev[prev.length - 1];
      const lastDate = new Date(lastPeriod.periodEnd);
      const newYear = lastDate.getFullYear() + 1;
      const newDateStr = `${newYear}-12-31`;
      const newPeriod: PeriodDefinition = {
        periodId: `${newDateStr}_v1`,
        periodEnd: newDateStr,
        periodType: 'Y',
      };
      return [...prev, newPeriod];
    });
  }, []);

  const removePeriod = useCallback(() => {
    setPeriods(prev => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const handleDeletePeriod = useCallback((periodId: string) => {
    setPeriods(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(p => p.periodId !== periodId);
    });
    setValues(prev => {
      const newValues = new Map(prev);
      for (const key of Array.from(newValues.keys())) {
        if (key.endsWith(`|${periodId}`)) {
          newValues.delete(key);
        }
      }
      return newValues;
    });
  }, []);

  const handleClearPeriod = useCallback((periodId: string) => {
    setValues(prev => {
      const newValues = new Map(prev);
      for (const key of Array.from(newValues.keys())) {
        if (key.endsWith(`|${periodId}`)) {
          newValues.delete(key);
        }
      }
      return newValues;
    });
  }, []);

  const handleInsertColumn = useCallback((atColIndex: number, position: 'left' | 'right', mode: 'clone' | 'blank') => {
    const sourcePeriod = periods[atColIndex];
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
    };

    setPeriods(prev => {
      const newPeriods = [...prev];
      const insertAt = position === 'left' ? atColIndex : atColIndex + 1;
      newPeriods.splice(insertAt, 0, newPeriod);
      return newPeriods;
    });

    // If clone, copy all values from source period
    if (mode === 'clone') {
      setValues(prev => {
        const newValues = new Map(prev);
        rows.forEach(row => {
          const sourceKey = makeValueKey(row.lineItemCode, sourcePeriod.periodId);
          const sourceVal = prev.get(sourceKey);
          if (sourceVal !== undefined) {
            const newKey = makeValueKey(row.lineItemCode, newPeriodId);
            newValues.set(newKey, sourceVal);
          }
        });
        return newValues;
      });
    }
  }, [periods, rows, nextVariantId]);

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

    setRows(prev => {
      const newRows = [...prev];
      const insertAt = position === 'above' ? atIndex : atIndex + 1;
      newRows.splice(insertAt, 0, newRow);
      return newRows;
    });
  }, [nextCustomId]);

  const handleDeleteRow = useCallback((atIndex: number) => {
    setRows(prev => {
      const row = prev[atIndex];
      setValues(prevValues => {
        const newValues = new Map(prevValues);
        for (const key of Array.from(newValues.keys())) {
          if (key.startsWith(`${row.lineItemCode}|`)) {
            newValues.delete(key);
          }
        }
        return newValues;
      });
      const newRows = [...prev];
      newRows.splice(atIndex, 1);
      return newRows;
    });
  }, []);

  const handleMoveRow = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    setRows(prev => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const newRows = [...prev];
      const temp = newRows[fromIndex];
      newRows[fromIndex] = newRows[toIndex];
      newRows[toIndex] = temp;
      return newRows;
    });
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Financial Spreading Grid</h1>
      </header>

      <div className="toolbar">
        <div className="toolbar-section">
          <label>Periods:</label>
          <div className="period-controls">
            <button 
              className="period-btn remove" 
              onClick={removePeriod}
              disabled={periods.length <= 1}
              title="Remove last period"
            >
              −
            </button>
            <span className="period-count">{periods.length} periods</span>
            <button 
              className="period-btn add" 
              onClick={addPeriod}
              title="Add new period"
            >
              +
            </button>
          </div>
          <div className="period-list">
            {periods.map(p => (
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
            value={dateFormat}
            onChange={e => setDateFormat(e.target.value as DateDisplayFormat)}
          >
            <option value="MM/DD/YYYY">12/31/2022</option>
            <option value="MM/DD/YY">12/31/22</option>
            <option value="MM/YY">12/22</option>
          </select>
        </div>

        <div className="toolbar-section">
          <label>Negatives:</label>
          <select
            value={negativeFormat}
            onChange={e => setNegativeFormat(e.target.value as NegativeDisplayFormat)}
          >
            <option value="parentheses">(1,093)</option>
            <option value="minus">-1,093</option>
          </select>
        </div>

        <div className="toolbar-section">
          <label>Scale:</label>
          <select
            value={displayScale}
            onChange={e => setDisplayScale(e.target.value as DisplayScale)}
          >
            <option value="units">Units</option>
            <option value="thousands">Thousands</option>
            <option value="millions">Millions</option>
          </select>
        </div>
      </div>

      <main className="grid-container">
        <FinancialGrid
          rows={rows}
          periods={visiblePeriods}
          values={values}
          companyName={companyName}
          onChange={handleChange}
          onDeletePeriod={handleDeletePeriod}
          onClearPeriod={handleClearPeriod}
          onInsertColumn={handleInsertColumn}
          onInsertRow={handleInsertRow}
          onDeleteRow={handleDeleteRow}
          onMoveRow={handleMoveRow}
          negativeFormat={negativeFormat}
          displayScale={displayScale}
          dateFormat={dateFormat}
          decimalPlaces={0}
        />
      </main>
    </div>
  );
}

export default App;