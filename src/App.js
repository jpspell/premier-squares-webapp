import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Squares from './components/Squares';
import GameSelector from './components/GameSelector';
import NameEntry from './components/NameEntry';
import ErrorBoundary from './components/ErrorBoundary';

// Contest route component that gets the documentId from URL params
function ContestPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const handleNamesSubmitted = () => {
    // Navigate to squares page after names are submitted
    navigate(`/contests/${documentId}/squares`);
  };

  return (
    <div className="App">
      <ErrorBoundary>
        <NameEntry contestId={documentId} onNamesSubmitted={handleNamesSubmitted} />
      </ErrorBoundary>
    </div>
  );
}

// Main app component with routing
function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [squareCost, setSquareCost] = useState(10);
  const [contestId, setContestId] = useState(null);
  const navigate = useNavigate();

  const handleGameSelect = (eventId, costPerSquare, contestIdFromResponse) => {
    if (!contestIdFromResponse) {
      // Could add error state here if needed
      return;
    }
    
    setSelectedGameId(eventId);
    setSquareCost(costPerSquare);
    setContestId(contestIdFromResponse);
    // Navigate to contest page using the documentId
    navigate(`/contests/${contestIdFromResponse}`);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'squares':
        return (
          <ErrorBoundary>
            <Squares />
          </ErrorBoundary>
        );
      case 'home':
      default:
        return (
          <div className="home-container">
            <ErrorBoundary>
              <GameSelector onGameSelect={handleGameSelect} />
            </ErrorBoundary>
          </div>
        );
    }
  };

  return (
    <>
      {currentPage !== 'home' && (
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      )}
      <main className="main-content">
        {renderPage()}
      </main>
    </>
  );
}

// Component to handle scroll prevention
function ScrollPreventer() {
  const location = useLocation();
  
  useEffect(() => {
    const isHomePage = location.pathname === '/';
    const isSquaresPage = location.pathname.includes('/squares');
    
    if (isHomePage || isSquaresPage) {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    } else {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    };
  }, [location]);
  
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollPreventer />
        <Routes>
          <Route path="/" element={
            <div className="App no-scroll home-page">
              <AppContent />
            </div>
          } />
          <Route path="/contests/:documentId" element={<ContestPage />} />
                  <Route path="/contests/:documentId/squares" element={
          <div className="App no-scroll squares-page">
            <ErrorBoundary>
              <Squares />
            </ErrorBoundary>
          </div>
        } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

