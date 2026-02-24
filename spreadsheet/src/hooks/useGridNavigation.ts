import { useCallback, useRef, useEffect } from 'react';
import { CellPosition, RowDefinition, PeriodDefinition } from '../types/grid.types';

interface UseGridNavigationProps {
  rows: RowDefinition[];
  periods: PeriodDefinition[];
  focusedCell: CellPosition | null;
  editingCell: CellPosition | null;
  onFocusChange: (position: CellPosition | null) => void;
  onStartEdit: (position: CellPosition) => void;
  onCancelEdit: () => void;
  onCommitEdit: () => void;
}

export function useGridNavigation({
  rows,
  periods,
  focusedCell,
  editingCell,
  onFocusChange,
  onStartEdit,
  onCancelEdit,
  onCommitEdit,
}: UseGridNavigationProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const makeCellKey = (rowIndex: number, colIndex: number) => `${rowIndex}-${colIndex}`;

  const getCellRef = useCallback((rowIndex: number, colIndex: number) => {
    return (el: HTMLInputElement | null) => {
      const key = makeCellKey(rowIndex, colIndex);
      if (el) {
        cellRefs.current.set(key, el);
      } else {
        cellRefs.current.delete(key);
      }
    };
  }, []);

  const focusCell = useCallback((position: CellPosition) => {
    const key = makeCellKey(position.rowIndex, position.colIndex);
    const cell = cellRefs.current.get(key);
    if (cell) cell.focus();
  }, []);

  const findNextEditableRow = useCallback((startRow: number, direction: 'up' | 'down'): number | null => {
    const step = direction === 'up' ? -1 : 1;
    let row = startRow + step;
    while (row >= 0 && row < rows.length) {
      if (rows[row].isEditable && rows[row].rowType === 'data') return row;
      row += step;
    }
    return null;
  }, [rows]);

  const findNextColumn = useCallback((startCol: number, direction: 'left' | 'right'): number | null => {
    const step = direction === 'left' ? -1 : 1;
    const newCol = startCol + step;
    return (newCol >= 0 && newCol < periods.length) ? newCol : null;
  }, [periods]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onCancelEdit();
          break;
        case 'Enter':
          e.preventDefault();
          onCommitEdit();
          if (focusedCell) {
            const nextRow = findNextEditableRow(focusedCell.rowIndex, 'down');
            if (nextRow !== null) {
              onFocusChange({ rowIndex: nextRow, colIndex: focusedCell.colIndex });
            }
          }
          break;
        case 'Tab':
          e.preventDefault();
          onCommitEdit();
          if (focusedCell) {
            const nextCol = findNextColumn(focusedCell.colIndex, e.shiftKey ? 'left' : 'right');
            if (nextCol !== null) {
              onFocusChange({ rowIndex: focusedCell.rowIndex, colIndex: nextCol });
            }
          }
          break;
      }
      return;
    }

    if (!focusedCell) return;

    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault();
        const nextRow = findNextEditableRow(focusedCell.rowIndex, 'up');
        if (nextRow !== null) onFocusChange({ rowIndex: nextRow, colIndex: focusedCell.colIndex });
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        const nextRow = findNextEditableRow(focusedCell.rowIndex, 'down');
        if (nextRow !== null) onFocusChange({ rowIndex: nextRow, colIndex: focusedCell.colIndex });
        break;
      }
      case 'ArrowLeft': {
        e.preventDefault();
        const nextCol = findNextColumn(focusedCell.colIndex, 'left');
        if (nextCol !== null) onFocusChange({ rowIndex: focusedCell.rowIndex, colIndex: nextCol });
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        const nextCol = findNextColumn(focusedCell.colIndex, 'right');
        if (nextCol !== null) onFocusChange({ rowIndex: focusedCell.rowIndex, colIndex: nextCol });
        break;
      }
      case 'Enter': {
        e.preventDefault();
        const nextRow = findNextEditableRow(focusedCell.rowIndex, 'down');
        if (nextRow !== null) onFocusChange({ rowIndex: nextRow, colIndex: focusedCell.colIndex });
        break;
      }
      case 'Tab': {
        e.preventDefault();
        const nextCol = findNextColumn(focusedCell.colIndex, e.shiftKey ? 'left' : 'right');
        if (nextCol !== null) onFocusChange({ rowIndex: focusedCell.rowIndex, colIndex: nextCol });
        break;
      }
      case 'F2': {
        e.preventDefault();
        if (rows[focusedCell.rowIndex].isEditable) onStartEdit(focusedCell);
        break;
      }
      default: {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          if (rows[focusedCell.rowIndex].isEditable) onStartEdit(focusedCell);
        }
        break;
      }
    }
  }, [focusedCell, editingCell, rows, onFocusChange, onStartEdit, onCancelEdit, onCommitEdit, findNextEditableRow, findNextColumn]);

  useEffect(() => {
    if (focusedCell && !editingCell) focusCell(focusedCell);
  }, [focusedCell, editingCell, focusCell]);

  return { handleKeyDown, gridRef, getCellRef };
}