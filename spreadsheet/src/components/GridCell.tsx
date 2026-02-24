import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatNumber, parseNumber } from '../utils/formatNumber';
import { NegativeDisplayFormat, DisplayScale } from '../types/grid.types';

interface GridCellProps {
  value: number | null;
  isEditable: boolean;
  isFocused: boolean;
  isEditing: boolean;
  editValue: string;
  negativeFormat: NegativeDisplayFormat;
  displayScale: DisplayScale;
  decimalPlaces: number;
  onFocus: () => void;
  onStartEdit: () => void;
  onEditChange: (value: string) => void;
  onCommit: (value: number | null) => void;
  onCancel: () => void;
  cellRef: (el: HTMLInputElement | null) => void;
}

export const GridCell: React.FC<GridCellProps> = ({
  value,
  isEditable,
  isFocused,
  isEditing,
  editValue,
  negativeFormat,
  displayScale,
  decimalPlaces,
  onFocus,
  onStartEdit,
  onEditChange,
  onCommit,
  onCancel,
  cellRef,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(editValue);

  // Sync local value when editValue changes (entering edit mode)
  useEffect(() => {
    if (isEditing) {
      setLocalValue(editValue);
    }
  }, [isEditing, editValue]);

  const setRef = useCallback((el: HTMLInputElement | null) => {
    (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
    cellRef(el);
  }, [cellRef]);

  const displayValue = isEditing
    ? localValue
    : formatNumber(value, { negativeFormat, displayScale, decimalPlaces });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    onEditChange(e.target.value);
  }, [onEditChange]);

  const handleBlur = useCallback(() => {
    if (isEditing) {
      const parsed = parseNumber(localValue);
      onCommit(parsed);
    }
  }, [isEditing, localValue, onCommit]);

  const handleFocus = useCallback(() => {
    if (!isFocused) onFocus();
  }, [isFocused, onFocus]);

  const handleDoubleClick = useCallback(() => {
    if (isEditable && !isEditing) onStartEdit();
  }, [isEditable, isEditing, onStartEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const parsed = parseNumber(localValue);
        onCommit(parsed);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    } else {
      // Not editing - Backspace or Delete clears the cell
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        onCommit(null);
      }
    }
  }, [isEditing, localValue, onCommit, onCancel]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  const getCellClassName = (): string => {
    const classes = ['grid-cell'];
    if (isFocused) classes.push('grid-cell--focused');
    if (isEditing) classes.push('grid-cell--editing');
    if (!isEditable) classes.push('grid-cell--readonly');
    if (value !== null && value < 0) classes.push('grid-cell--negative');
    return classes.join(' ');
  };

  return (
    <input
      ref={setRef}
      type="text"
      className={getCellClassName()}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      readOnly={!isEditing || !isEditable}
      tabIndex={isEditable ? 0 : -1}
    />
  );
};

export default GridCell;