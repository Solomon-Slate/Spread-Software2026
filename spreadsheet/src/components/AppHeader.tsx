import React from 'react';
import './AppHeader.css';

const AppHeader: React.FC = () => {
  return (
    <header className="app-header">
      <div className="app-header-brand">J-Spread</div>
      <nav className="app-header-nav">
        <button className="nav-button">File</button>
        <button className="nav-button">View</button>
        <button className="nav-button">Tools</button>
        <button className="nav-button">Help</button>
      </nav>
      <div className="app-header-spacer" />
      <div className="app-header-user">User: Analyst</div>
    </header>
  );
};

export default AppHeader;
