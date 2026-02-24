import React, { useState, useCallback, useMemo } from 'react';
import { FinancialGrid } from './components/FinancialGrid';
import { mockRows, allPeriods, createMockValues } from './data/mockData';
import { NegativeDisplayFormat, DisplayScale, CellChange, PeriodDefinition } from './types/grid.types';
import './App.css';

function App() {
  const [values, setValues] = useState(() => createMockValues());
  const [negativeFormat, setNegativeFormat] = useState<NegativeDisplayFormat>('parentheses');
  const [displayScale, setDisplayScale] = useState<DisplayScale>('units');
  const [periods, setPeriods] = useState<PeriodDefinition[]>(allPeriods);
  const [hiddenPeriods, setHiddenPeriods] = useState<Set<string>>(new Set());

  const visiblePeriods = useMemo(() => {
    return periods.filter(p => !hiddenPeriods.has(p.periodEnd));
  }, [periods, hiddenPeriods]);

  const handleChange = useCallback((changes: CellChange[]) => {
    setValues(prev => {
      const newValues = new Map(prev);
      for (const change of changes) {
        const key = `${change.lineItemCode}|${change.periodEnd}`;
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
      // Find the last period and increment the year
      const lastPeriod = prev[prev.length - 1];
      const lastYear = parseInt(lastPeriod.label.replace('FY ', ''));
      const newYear = lastYear + 1;
      const newPeriod: PeriodDefinition = {
        periodEnd: `${newYear}-12-31`,
        periodType: 'Y',
        label: `FY ${newYear}`,
      };
      return [...prev, newPeriod];
    });
  }, []);

  const removePeriod = useCallback(() => {
    setPeriods(prev => {
      if (prev.length <= 1) return prev; // Keep at least one period
      return prev.slice(0, -1);
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
                key={p.periodEnd} 
                className={`period-tag ${hiddenPeriods.has(p.periodEnd) ? 'hidden' : ''}`}
                onClick={() => {
                  setHiddenPeriods(prev => {
                    const next = new Set(prev);
                    if (next.has(p.periodEnd)) {
                      next.delete(p.periodEnd);
                    } else {
                      next.add(p.periodEnd);
                    }
                    return next;
                  });
                }}
                title={hiddenPeriods.has(p.periodEnd) ? 'Click to show' : 'Click to hide'}
              >
                {p.label}
              </span>
            ))}
          </div>
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
          rows={mockRows}
          periods={visiblePeriods}
          values={values}
          onChange={handleChange}
          negativeFormat={negativeFormat}
          displayScale={displayScale}
          decimalPlaces={0}
        />
      </main>
    </div>
  );
}

export default App;