import React from 'react';
import './StatementTabBar.css';

export type StatementType = 'BS' | 'IS' | 'CF';

interface StatementTabBarProps {
  activeStatement: StatementType;
  onSelectStatement: (stmt: StatementType) => void;
  cashFlowAvailable: boolean;
}

const StatementTabBar: React.FC<StatementTabBarProps> = ({
  activeStatement,
  onSelectStatement,
  cashFlowAvailable,
}) => {
  return (
    <div className="statement-tab-bar">
      <button
        className={`statement-tab ${activeStatement === 'BS' ? 'active' : ''}`}
        onClick={() => onSelectStatement('BS')}
      >
        Balance Sheet
      </button>
      <button
        className={`statement-tab ${activeStatement === 'IS' ? 'active' : ''}`}
        onClick={() => onSelectStatement('IS')}
      >
        Income Statement
      </button>
      <button
        className={`statement-tab ${activeStatement === 'CF' ? 'active' : ''}`}
        onClick={() => onSelectStatement('CF')}
        disabled={!cashFlowAvailable}
        title={!cashFlowAvailable ? 'Requires Balance Sheet and Income Statement data' : ''}
      >
        Cash Flow
      </button>
    </div>
  );
};

export default StatementTabBar;
