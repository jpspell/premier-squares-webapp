import React from 'react';

function Navigation({ currentPage, onPageChange }) {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>Premier Squares</h2>
        </div>
        <div className="nav-links">
          <button 
            className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => onPageChange('home')}
          >
            Home
          </button>
          <button 
            className={`nav-link ${currentPage === 'squares' ? 'active' : ''}`}
            onClick={() => onPageChange('squares')}
          >
            Squares
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
