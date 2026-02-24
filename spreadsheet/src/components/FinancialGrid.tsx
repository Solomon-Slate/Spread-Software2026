import React, { useState, useCallback, useMemo } from 'react';
import GridCell from './GridCell';
import { useGridNavigation } from '../hooks/useGridNavigation';
import { formatForEditing } from '../utils/formatNumber';
import {
  GridProps,
  GridState,
  CellPosition,
  CellChange,
  makeValueKey,
} from '../types/grid.types';
import './FinancialGrid.css';

export const FinancialGrid: React.FC<GridProps> = ({
  rows,
  periods,
  values,
  onChange,
  onDeletePeriod,
  onClearPeriod,
  negativeFormat = 'parentheses',
  displayScale = 'units',
  decimalPlaces = 0,
}) => {
  const [state, setState] = useState<GridState>({
    focusedCell: null,
    editingCell: null,
    editValue: '',
  });

  const handleFocusChange = useCallback((position: CellPosition | null) => {
    setState(prev => ({
      ...prev,
      focusedCell: position,
      editingCell: null,
      editValue: '',
    }));
  }, []);

  const handleStartEdit = useCallback((position: CellPosition) => {
    const row = rows[position.rowIndex];
    const period = periods[position.colIndex];
    const key = makeValueKey(row.lineItemCode, period.periodEnd);
    const value = values.get(key) ?? null;

    setState(prev => ({
      ...prev,
      focusedCell: position,
      editingCell: position,
      editValue: formatForEditing(value),
    }));
  }, [rows, periods, values]);

  const handleCancelEdit = useCallback(() => {
    setState(prev => ({ ...prev, editingCell: null, editValue: '' }));
  }, []);

  const handleCommitEdit = useCallback(() => {
    setState(prev => ({ ...prev, editingCell: null, editValue: '' }));
  }, []);

  const { handleKeyDown, gridRef, getCellRef } = useGridNavigation({
    rows,
    periods,
    focusedCell: state.focusedCell,
    editingCell: state.editingCell,
    onFocusChange: handleFocusChange,
    onStartEdit: handleStartEdit,
    onCancelEdit: handleCancelEdit,
    onCommitEdit: handleCommitEdit,
  });

  const handleEditChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, editValue: value }));
  }, []);

  const handleCellCommit = useCallback((
    rowIndex: number,
    colIndex: number,
    newValue: number | null
  ) => {
    const row = rows[rowIndex];
    const period = periods[colIndex];
    const key = makeValueKey(row.lineItemCode, period.periodEnd);
    const oldValue = values.get(key) ?? null;

    if (oldValue !== newValue) {
      const change: CellChange = {
        lineItemCode: row.lineItemCode,
        periodEnd: period.periodEnd,
        oldValue,
        newValue,
      };
      onChange([change]);
    }

    setState(prev => ({ ...prev, editingCell: null, editValue: '' }));
  }, [rows, periods, values, onChange]);

  const gridTemplateColumns = useMemo(() => {
    const labelWidth = '250px';
    const periodWidth = '120px';
    return `${labelWidth} repeat(${periods.length}, ${periodWidth})`;
  }, [periods.length]);

  const getRowClass = (rowType: string): string => {
    switch (rowType) {
      case 'subtotal': return 'row-subtotal';
      case 'total': return 'row-total';
      case 'sectionHeader': return 'row-sectionHeader';
      case 'spacer': return 'row-spacer';
      default: return 'row-data';
    }
  };

  const isCellFocused = (rowIndex: number, colIndex: number): boolean => {
    return state.focusedCell?.rowIndex === rowIndex &&
           state.focusedCell?.colIndex === colIndex;
  };

  const isCellEditing = (rowIndex: number, colIndex: number): boolean => {
    return state.editingCell?.rowIndex === rowIndex &&
           state.editingCell?.colIndex === colIndex;
  };

  return (
    <div ref={gridRef} className="financial-grid-container" onKeyDown={handleKeyDown}>
      <div className="financial-grid" style={{ gridTemplateColumns }} role="grid">
        {/* Period controls row */}
        <div className="grid-period-controls-spacer"></div>
        {periods.map((period) => (
          <div key={`controls-${period.periodEnd}`} className="grid-period-controls">
            <button
              className="period-control-btn clear"
              title="Clear all values in this period"
              onClick={() => {
                if (onClearPeriod && window.confirm(`Clear all values in ${period.label}?`)) {
                  onClearPeriod(period.periodEnd);
                }
              }}
            >
              ⌫
            </button>
            <button
              className="period-control-btn delete"
              title="Delete this period"
              onClick={() => {
                if (onDeletePeriod && window.confirm(`Delete ${period.label}?`)) {
                  onDeletePeriod(period.periodEnd);
                }
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Header row */}
        <div className="grid-header grid-header--label">Account</div>
        {periods.map((period) => (
          <div key={period.periodEnd} className="grid-header grid-header--period">
            {period.label}
          </div>
        ))}

        {rows.map((row, rowIndex) => {
          const rowClass = getRowClass(row.rowType);

          if (row.rowType === 'sectionHeader') {
            return (
              <div key={row.lineItemCode} className={`grid-row ${rowClass}`} style={{ gridColumn: '1 / -1' }}>
                <div className="grid-row-label grid-row-label--header">{row.label}</div>
              </div>
            );
          }

          if (row.rowType === 'spacer') {
            return <div key={row.lineItemCode} className={`grid-row ${rowClass}`} style={{ gridColumn: '1 / -1', height: '16px' }} />;
          }

          return (
            <React.Fragment key={row.lineItemCode}>
              <div className={`grid-row-label ${rowClass}`} style={{ paddingLeft: `${12 + row.indentLevel * 20}px` }}>
                {row.label}
              </div>
              {periods.map((period, colIndex) => {
                const key = makeValueKey(row.lineItemCode, period.periodEnd);
                const value = values.get(key) ?? null;
                return (
                  <div key={`${row.lineItemCode}-${period.periodEnd}`} className={`grid-cell-wrapper ${rowClass}`}>
                    <GridCell
                      value={value}
                      isEditable={row.isEditable}
                      isFocused={isCellFocused(rowIndex, colIndex)}
                      isEditing={isCellEditing(rowIndex, colIndex)}
                      editValue={state.editValue}
                      negativeFormat={negativeFormat}
                      displayScale={displayScale}
                      decimalPlaces={decimalPlaces}
                      onFocus={() => handleFocusChange({ rowIndex, colIndex })}
                      onStartEdit={() => handleStartEdit({ rowIndex, colIndex })}
                      onEditChange={handleEditChange}
                      onCommit={(newValue) => handleCellCommit(rowIndex, colIndex, newValue)}
                      onCancel={handleCancelEdit}
                      cellRef={getCellRef(rowIndex, colIndex)}
                    />
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default FinancialGrid;