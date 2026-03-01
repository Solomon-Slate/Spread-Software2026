import React, { useState, useCallback, useMemo } from 'react';
import GridCell from './GridCell';
import ContextMenu, { ContextMenuAction } from './ContextMenu';
import { useGridNavigation } from '../hooks/useGridNavigation';
import { formatForEditing } from '../utils/formatNumber';
import {
  GridProps,
  GridState,
  CellPosition,
  CellChange,
  CellHighlight,
  makeValueKey,
  formatPeriodDate,
} from '../types/grid.types';
import './FinancialGrid.css';

const DEFAULT_HIGHLIGHT: CellHighlight = { fontHighlight: null, backgroundHighlight: null, boldBorder: false };

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  rowIndex: number;
  colIndex: number;
  target: 'row' | 'column' | 'cell';
}

export const FinancialGrid: React.FC<GridProps> = ({
  rows,
  periods,
  values,
  highlights,
  companyName,
  onChange,
  onHighlightChange,
  comments,
  onCommentChange,
  onDeletePeriod,
  onClearPeriod,
  onInsertColumn,
  onToggleActive,
  onInsertRow,
  onDeleteRow,
  onMoveRow,
  negativeFormat = 'parentheses',
  displayScale = 'units',
  dateFormat = 'MM/DD/YYYY',
  decimalPlaces = 0,
}) => {
  const [state, setState] = useState<GridState>({
    focusedCell: null,
    editingCell: null,
    editValue: '',
  });

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    rowIndex: -1,
    colIndex: -1,
    target: 'row',
  });

  

  const rowNumbers = useMemo(() => {
    const map = new Map<number, number>();
    let counter = 0;
    rows.forEach((row, index) => {
      if (row.rowType === 'data' || row.rowType === 'subtotal' || row.rowType === 'total') {
        counter++;
        map.set(index, counter);
      }
    });
    return map;
  }, [rows]);

  const periodNumbers = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 0;
    let lastDate = '';
    periods.forEach((period) => {
      if (period.periodEnd !== lastDate) {
        counter++;
        lastDate = period.periodEnd;
      }
      map.set(period.periodId, counter);
    });
    return map;
  }, [periods]);

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
    const key = makeValueKey(row.lineItemCode, period.periodId);
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
    const key = makeValueKey(row.lineItemCode, period.periodId);
    const oldValue = values.get(key) ?? null;

    if (oldValue !== newValue) {
      const change: CellChange = {
        lineItemCode: row.lineItemCode,
        periodId: period.periodId,
        oldValue,
        newValue,
      };
      onChange([change]);
    }

    setState(prev => ({ ...prev, editingCell: null, editValue: '' }));
  }, [rows, periods, values, onChange]);

  const handleRowContextMenu = useCallback((e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      rowIndex,
      colIndex: -1,
      target: 'row',
    });
  }, []);

  const handleColumnContextMenu = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      rowIndex: -1,
      colIndex,
      target: 'column',
    });
  }, []);

  const handleCellContextMenu = useCallback((e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      rowIndex,
      colIndex,
      target: 'cell',
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const getRowContextMenuActions = useCallback((rowIndex: number): ContextMenuAction[] => {
    const row = rows[rowIndex];
    const isDataRow = row.rowType === 'data';

    return [
      {
        label: 'Insert Row Above',
        onClick: () => onInsertRow?.(rowIndex, 'above'),
      },
      {
        label: 'Insert Row Below',
        onClick: () => onInsertRow?.(rowIndex, 'below'),
      },
      { label: '', onClick: () => {}, separator: true },
      {
        label: 'Move Row Up',
        onClick: () => onMoveRow?.(rowIndex, 'up'),
        disabled: rowIndex === 0,
      },
      {
        label: 'Move Row Down',
        onClick: () => onMoveRow?.(rowIndex, 'down'),
        disabled: rowIndex === rows.length - 1,
      },
      { label: '', onClick: () => {}, separator: true },
      {
        label: 'Delete Row',
        onClick: () => {
          if (window.confirm(`Delete "${row.label}"?`)) {
            onDeleteRow?.(rowIndex);
          }
        },
        disabled: !isDataRow,
      },
    ];
  }, [rows, onInsertRow, onDeleteRow, onMoveRow]);

  const getColumnContextMenuActions = useCallback((colIndex: number): ContextMenuAction[] => {
    const period = periods[colIndex];
    const dateStr = formatPeriodDate(period.periodEnd, dateFormat);
    const label = period.variant ? `${dateStr} (${period.variant})` : dateStr;

    return [
      {
        label: 'Insert Blank Column Left',
        onClick: () => onInsertColumn?.(colIndex, 'left', 'blank'),
      },
      {
        label: 'Insert Blank Column Right',
        onClick: () => onInsertColumn?.(colIndex, 'right', 'blank'),
      },
      { label: '', onClick: () => {}, separator: true },
      {
        label: 'Clone Column Left',
        onClick: () => onInsertColumn?.(colIndex, 'left', 'clone'),
      },
      {
        label: 'Clone Column Right',
        onClick: () => onInsertColumn?.(colIndex, 'right', 'clone'),
      },
      { label: '', onClick: () => {}, separator: true },
      {
        label: period.isActive ? '✓ Active (click to deactivate)' : 'Set as Active',
        onClick: () => onToggleActive?.(period.periodId),
      },
      { label: '', onClick: () => {}, separator: true },
      {
        label: `Clear Values`,
        onClick: () => {
          if (window.confirm(`Clear all values in ${label}?`)) {
            onClearPeriod?.(period.periodId);
          }
        },
      },
      {
        label: `Delete Column`,
        onClick: () => {
          if (window.confirm(`Delete ${label}?`)) {
            onDeletePeriod?.(period.periodId);
          }
        },
        disabled: periods.length <= 1,
      },
    ];
  }, [periods, dateFormat, onInsertColumn, onToggleActive,onClearPeriod, onDeletePeriod]);

  const getCellContextMenuActions = useCallback((rowIndex: number, colIndex: number): ContextMenuAction[] => {
    const row = rows[rowIndex];
    const period = periods[colIndex];
    const key = makeValueKey(row.lineItemCode, period.periodId);
    const current = highlights.get(key) || { ...DEFAULT_HIGHLIGHT };

    const setHighlight = (update: Partial<CellHighlight>) => {
      const merged = { ...current, ...update };
      const isEmpty = !merged.fontHighlight && !merged.backgroundHighlight && !merged.boldBorder;
      onHighlightChange?.(key, isEmpty ? null : merged);
    };

    return [
      { label: 'Font Color', onClick: () => {}, separator: false, disabled: true },
      {
        label: `${current.fontHighlight === 'red' ? '✓ ' : '  '}Bold Red`,
        onClick: () => setHighlight({ fontHighlight: current.fontHighlight === 'red' ? null : 'red' }),
      },
      {
        label: `${current.fontHighlight === 'green' ? '✓ ' : '  '}Bold Green`,
        onClick: () => setHighlight({ fontHighlight: current.fontHighlight === 'green' ? null : 'green' }),
      },
      {
        label: `${current.fontHighlight === 'blue' ? '✓ ' : '  '}Bold Blue`,
        onClick: () => setHighlight({ fontHighlight: current.fontHighlight === 'blue' ? null : 'blue' }),
      },
      { label: '', onClick: () => {}, separator: true },
      { label: 'Background', onClick: () => {}, separator: false, disabled: true },
      {
        label: `${current.backgroundHighlight === 'orange' ? '✓ ' : '  '}Orange`,
        onClick: () => setHighlight({ backgroundHighlight: current.backgroundHighlight === 'orange' ? null : 'orange' }),
      },
      {
        label: `${current.backgroundHighlight === 'yellow' ? '✓ ' : '  '}Yellow`,
        onClick: () => setHighlight({ backgroundHighlight: current.backgroundHighlight === 'yellow' ? null : 'yellow' }),
      },
      {
        label: `${current.backgroundHighlight === 'pink' ? '✓ ' : '  '}Pink`,
        onClick: () => setHighlight({ backgroundHighlight: current.backgroundHighlight === 'pink' ? null : 'pink' }),
      },
      { label: '', onClick: () => {}, separator: true },
      {
        label: `${current.boldBorder ? '✓ ' : '  '}Bold Border`,
        onClick: () => setHighlight({ boldBorder: !current.boldBorder }),
      },
      { label: '', onClick: () => {}, separator: true },
      {
        label: 'Clear All Formatting',
        onClick: () => onHighlightChange?.(key, null),
        disabled: !highlights.has(key),
      },
      { label: '', onClick: () => {}, separator: true },
      {
        label: comments.has(key) ? 'Edit Comment' : 'Add Comment',
        onClick: () => {
          const existing = comments.get(key) || '';
          const input = window.prompt('Enter comment:', existing);
          if (input !== null) {
            onCommentChange?.(key, input.trim() === '' ? null : input.trim());
          }
        },
      },
      {
        label: 'Remove Comment',
        onClick: () => onCommentChange?.(key, null),
        disabled: !comments.has(key),
      },];
  }, [rows, periods, highlights, onHighlightChange,comments,onCommentChange]);

  const gridTemplateColumns = useMemo(() => {
    const rowNumWidth = '40px';
    const labelWidth = '250px';
    const periodWidth = '120px';
    return `${rowNumWidth} ${labelWidth} repeat(${periods.length}, ${periodWidth})`;
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

  const formatPeriodHeader = (period: typeof periods[0]): React.ReactNode => {
    const dateStr = formatPeriodDate(period.periodEnd, dateFormat);
    if (period.variant) {
      return (
        <>
          <div>{dateStr}</div>
          <div className="period-variant-label">{period.variant}</div>
        </>
      );
    }
    return dateStr;
  };

  return (
    <div ref={gridRef} className="financial-grid-container" onKeyDown={handleKeyDown}>
      <div className="financial-grid" style={{ gridTemplateColumns }} role="grid">
        {/* Period column numbers row */}
        <div className="grid-period-controls-spacer"></div>
        <div className="grid-period-controls-spacer"></div>
        {periods.map((period) => (
          <div key={`colnum-${period.periodId}`} className="grid-colnum">
            {periodNumbers.get(period.periodId) ?? ''}
          </div>
        ))}

        {/* Period controls row */}
        <div className="grid-period-controls-spacer"></div>
        <div className="grid-period-controls-spacer"></div>
        {periods.map((period) => (
          <div key={`controls-${period.periodId}`} className="grid-period-controls">
            <button
              className="period-control-btn clear"
              title="Clear all values in this period"
              onClick={() => {
                const dateStr = formatPeriodDate(period.periodEnd, dateFormat);
                const lbl = period.variant ? `${dateStr} (${period.variant})` : dateStr;
                if (onClearPeriod && window.confirm(`Clear all values in ${lbl}?`)) {
                  onClearPeriod(period.periodId);
                }
              }}
            >
              ⌫
            </button>
            <button
              className="period-control-btn delete"
              title="Delete this period"
              onClick={() => {
                const dateStr = formatPeriodDate(period.periodEnd, dateFormat);
                const lbl = period.variant ? `${dateStr} (${period.variant})` : dateStr;
                if (onDeletePeriod && window.confirm(`Delete ${lbl}?`)) {
                  onDeletePeriod(period.periodId);
                }
              }}
            >
              ✕
            </button>
          </div>
        ))}

        {/* Header row */}
        <div className="grid-header grid-header--rownum">#</div>
        <div className="grid-header grid-header--label">{companyName || 'Company Name'}</div>
        {periods.map((period, colIndex) => (
          <div
            key={period.periodId}
            className="grid-header grid-header--period"
            onContextMenu={(e) => handleColumnContextMenu(e, colIndex)}
          >
            {formatPeriodHeader(period)}
          </div>
        ))}
        
        {/* Active/Inactive toggle bar row */}
        <div className="grid-active-bar-spacer"></div>
        <div className="grid-active-bar-spacer grid-active-bar-label">Status</div>
        {periods.map((period) => (
          <div
            key={`active-${period.periodId}`}
            className={`grid-active-bar ${period.isActive ? 'active' : 'inactive'}`}
            onClick={() => onToggleActive?.(period.periodId)}
            title={period.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
          >
            {period.isActive ? 'Active' : 'Inactive'}
          </div>
        ))}

        {rows.map((row, rowIndex) => {
          const rowClass = getRowClass(row.rowType);

          if (row.rowType === 'sectionHeader') {
            return (
              <div
                key={row.lineItemCode}
                className={`grid-row ${rowClass}`}
                style={{ gridColumn: '1 / -1' }}
                onContextMenu={(e) => handleRowContextMenu(e, rowIndex)}
              >
                <div className="grid-row-label grid-row-label--header">{row.label}</div>
              </div>
            );
          }

          if (row.rowType === 'spacer') {
            return <div key={row.lineItemCode} className={`grid-row ${rowClass}`} style={{ gridColumn: '1 / -1', height: '16px' }} />;
          }

          return (
            <React.Fragment key={row.lineItemCode}>
              <div
                className={`grid-rownum ${rowClass}`}
                onContextMenu={(e) => handleRowContextMenu(e, rowIndex)}
              >
                {rowNumbers.get(rowIndex) ?? ''}
              </div>
              <div
                className={`grid-row-label ${rowClass}`}
                style={{ paddingLeft: `${12 + row.indentLevel * 20}px` }}
                onContextMenu={(e) => handleRowContextMenu(e, rowIndex)}
              >
                {row.label}
              </div>
              {periods.map((period, colIndex) => {
                const key = makeValueKey(row.lineItemCode, period.periodId);
                const value = values.get(key) ?? null;
                return (
                  <div
                    key={`${row.lineItemCode}-${period.periodId}`}
                    className={`grid-cell-wrapper ${rowClass}${comments.has(key) ? ' grid-cell-wrapper--has-comment' : ''}`}
                    onContextMenu={(e) => handleCellContextMenu(e, rowIndex, colIndex)}
                  >
                    {comments.has(key) && (
                      <div className="cell-comment-tooltip">{comments.get(key)}</div>
                    )}
                  
                    <GridCell
                      value={value}
                      isEditable={row.isEditable}
                      isFocused={isCellFocused(rowIndex, colIndex)}
                      isEditing={isCellEditing(rowIndex, colIndex)}
                      editValue={state.editValue}
                      negativeFormat={negativeFormat}
                      displayScale={displayScale}
                      decimalPlaces={decimalPlaces}
                      highlight={highlights.get(key) || null}
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

      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={
            contextMenu.target === 'cell'
              ? getCellContextMenuActions(contextMenu.rowIndex, contextMenu.colIndex)
              : contextMenu.target === 'row'
              ? getRowContextMenuActions(contextMenu.rowIndex)
              : getColumnContextMenuActions(contextMenu.colIndex)
          }
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default FinancialGrid;