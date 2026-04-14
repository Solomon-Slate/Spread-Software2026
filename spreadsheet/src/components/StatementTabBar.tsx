import React from 'react';
import './StatementTabBar.css';
import type { ViewTab } from '../types/ui.types';

export type StatementType = 'BS' | 'IS' | 'CF';

interface StatementTabBarProps {
  activeStatement: ViewTab;
  onSelectStatement: (tab: ViewTab) => void;
  cashFlowAvailable: boolean;
  analysisAvailable?: boolean;
  chartsAvailable?: boolean;
  graphsAvailable?: boolean;
}

const StatementTabBar: React.FC<StatementTabBarProps> = ({
  activeStatement,
  onSelectStatement,
  cashFlowAvailable,
  analysisAvailable = false,
  chartsAvailable = false,
  graphsAvailable = false,
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
      <button
        className={`statement-tab ${activeStatement === 'Analysis' ? 'active' : ''}`}
        onClick={() => onSelectStatement('Analysis')}
        disabled={!analysisAvailable}
        title={!analysisAvailable ? 'Not yet available' : ''}
      >
        Analysis
      </button>
      <button
        className={`statement-tab ${activeStatement === 'Charts' ? 'active' : ''}`}
        onClick={() => onSelectStatement('Charts')}
        disabled={!chartsAvailable}
        title={!chartsAvailable ? 'Not yet available' : ''}
      >
        Charts
      </button>
      <button
        className={`statement-tab ${activeStatement === 'Graphs' ? 'active' : ''}`}
        onClick={() => onSelectStatement('Graphs')}
        disabled={!graphsAvailable}
        title={!graphsAvailable ? 'Not yet available' : ''}
      >
        Graphs
      </button>
    </div>
  );
};

export default StatementTabBar;
