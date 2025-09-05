import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Squares from './components/Squares';
import GameSelector from './components/GameSelector';
import NameEntry from './components/NameEntry';
import ErrorBoundary from './components/ErrorBoundary';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import BagBuilder from './components/BagBuilder';
import config from './config/config';

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
  const navigate = useNavigate();

  const handleGameSelect = (eventId, costPerSquare, contestIdFromResponse) => {
    if (!contestIdFromResponse) {
      // Could add error state here if needed
      return;
    }
    
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

// Win page component
function WinPage() {
  const [winner, setWinner] = useState(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing winner on component mount
  useEffect(() => {
    fetch(`${config.API_BASE_URL}/bagbuilder/winner`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then(data => {
        if (data && data.success && data.data && data.data.name) {
          setWinner(data.data.name);
        }
      })
      .catch(err => {
        console.error('Error checking for winner:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${config.API_BASE_URL}/bagbuilder/winner/${encodeURIComponent(name.trim())}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setWinner(name.trim());
      } else {
        setError('Failed to submit name. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="App">
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fbbf24',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center' }}>
            <h1>Loading...</h1>
          </div>
                  ) : winner ? (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.2rem' }}>🎒 {winner} has successfully built the bag! Please clap. 🎒</h1>
            </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>🎒 You're the ONE TRUE BAG BUILDER! Secure your prize before someone steals it! 🎒</h1>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '2px solid #475569',
                  background: 'rgba(30, 41, 59, 0.9)',
                  color: '#fbbf24',
                  width: '250px',
                  textAlign: 'center'
                }}
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={!name.trim() || isSubmitting}
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: name.trim() ? '#fbbf24' : '#475569',
                  color: name.trim() ? '#0f172a' : '#64748b',
                  cursor: name.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
            {error && (
              <p style={{ color: '#ef4444', marginTop: '1rem', fontSize: '1rem' }}>
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ServiceWorkerRegistration />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
          <Route path="/bagBuilderFinalBoss" element={
            <ErrorBoundary>
              <BagBuilder />
            </ErrorBoundary>
          } />
          <Route path="/45183" element={
            <Navigate to="/contests/MAOHJuxqBPm0Ont6Ju3l/squares" replace />
          } />
          <Route path="/contests/MAOHJuxqBPm0Ont6Ju3l/squares/bagBuilderFinalBoss" element={
            <ErrorBoundary>
              <BagBuilder />
            </ErrorBoundary>
          } />
          <Route path="/contests/MAOHJuxqBPm0Ont6Ju3l/squares/bagBuilderBossFinal" element={
            <div className="App">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fbbf24',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Not quite the correct route, try again!
              </div>
            </div>
          } />
          <Route path="/youWonTheWholeThing" element={<WinPage />} />
          <Route path="/bagBuilderBossFinal" element={
            <div className="App">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#fbbf24',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                Not quite the correct route, try again!
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

